import { createServer } from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { config } from "./config.js";
import { redis, redisSub, RedisKeys, setUserPresence, addOnlineUser, removeOnlineUser, addToQueue, removeFromQueue, findMatch } from "./redis.js";
import { verifyToken } from "./auth.js";
import { loadMatch, processMove, finalizeMatch } from "./game.js";
import { prisma } from "@tictac/database";
import { checkGameState, calculateElo, calculateXp } from "@tictac/shared";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: config.corsOrigin, credentials: true },
  pingInterval: config.pingInterval,
  pingTimeout: config.pingTimeout,
  connectionStateRecovery: {
    maxDisconnectionDuration: 120_000,
    skipMiddlewares: true,
  },
});

const pubClient = redis;
const subClient = redisSub;
io.adapter(createAdapter(pubClient, subClient));

interface AuthenticatedSocket {
  userId: string;
  username: string;
  rank: string;
  elo: number;
}

const userSockets = new Map<string, Set<string>>();
const socketUsers = new Map<string, AuthenticatedSocket>();

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  if (!token) {
    return next(new Error("Authentication required"));
  }

  const user = verifyToken(token as string);
  if (!user) {
    return next(new Error("Invalid token"));
  }

  (socket as any).user = user;
  next();
});

io.on("connection", async (socket) => {
  const user = (socket as any).user as AuthenticatedSocket;
  const userId = user.userId;

  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
    await addOnlineUser(userId);
    await setUserPresence(userId, { userId, username: user.username, status: "online", lastSeen: new Date().toISOString(), rank: user.rank, elo: user.elo });
    io.emit("presence:update", { userId, username: user.username, status: "online" });
  }
  userSockets.get(userId)!.add(socket.id);
  socketUsers.set(socket.id, user);
  socket.join(`user:${userId}`);

  socket.emit("player:connected", { userId, username: user.username });
  console.log(`[connect] ${user.username} (${userId}) - socket ${socket.id}`);

  socket.on("queue:join", async ({ mode }: { mode: string }, callback) => {
    try {
      await removeFromQueue(userId, mode);
      const profile = await prisma.profile.findUnique({ where: { id: userId } });
      const elo = profile?.elo ?? 1000;
      await addToQueue(userId, mode, elo);

      const match = await findMatch(mode, userId, elo);
      if (match) {
        const playerIsX = Math.random() < 0.5;
        const playerXId = playerIsX ? userId : match.userId;
        const playerOId = playerIsX ? match.userId : userId;

        const createdMatch = await prisma.match.create({
          data: {
            mode: mode as any,
            status: "playing",
            playerXId,
            playerOId,
            currentTurnId: playerXId,
            boardState: { board: Array(9).fill(null), moves: [] },
          },
          include: {
            playerX: { select: { id: true, username: true, elo: true, rank: true } },
            playerO: { select: { id: true, username: true, elo: true, rank: true } },
          },
        });

        const matchData = {
          matchId: createdMatch.id,
          playerSymbol: playerIsX ? "X" : "O",
          playerX: { username: createdMatch.playerX.username, elo: createdMatch.playerX.elo, rank: createdMatch.playerX.rank },
          playerO: { username: createdMatch.playerO!.username, elo: createdMatch.playerO!.elo, rank: createdMatch.playerO!.rank },
        };

        io.to(`user:${userId}`).emit("match:found", matchData);
        io.to(`user:${match.userId}`).emit("match:found", {
          ...matchData,
          playerSymbol: playerIsX ? "O" : "X",
        });

        await setUserPresence(userId, { userId, username: user.username, status: "in_game", currentMatchId: createdMatch.id, lastSeen: new Date().toISOString() });
        await setUserPresence(match.userId, { userId: match.userId, status: "in_game", currentMatchId: createdMatch.id, lastSeen: new Date().toISOString() });

        const room = `match:${createdMatch.id}`;
        io.sockets.sockets.forEach((s) => {
          const su = (s as any).user as AuthenticatedSocket;
          if (su && (su.userId === playerXId || su.userId === playerOId)) {
            s.join(room);
          }
        });

        io.to(room).emit("match:start", { matchId: createdMatch.id });

        if (callback) callback({ status: "matched", matchId: createdMatch.id, playerSymbol: playerIsX ? "X" : "O" });
      } else {
        if (callback) callback({ status: "waiting" });
      }
    } catch (error) {
      console.error("[queue:join]", error);
      if (callback) callback({ error: "Failed to join queue" });
    }
  });

  socket.on("queue:leave", async (_, callback) => {
    try {
      const modes = ["casual", "ranked", "ultimate"];
      for (const mode of modes) {
        await removeFromQueue(userId, mode);
      }
      if (callback) callback({ status: "left" });
    } catch (error) {
      console.error("[queue:leave]", error);
    }
  });

  socket.on("move:submit", async ({ matchId, position }: { matchId: string; position: number }, callback) => {
    try {
      const result = await processMove(matchId, userId, position);
      if (result.error) {
        socket.emit("move:rejected", { matchId, error: result.error });
        if (callback) callback({ error: result.error });
        return;
      }

      const room = `match:${matchId}`;
      io.to(room).emit("move:accepted", {
        matchId,
        boardState: result.boardState,
        gameResult: result.gameResult,
        status: result.status,
        nextTurnId: result.nextTurnId,
        position,
        playerId: userId,
      });

      io.to(room).emit("match:update", {
        matchId,
        boardState: result.boardState,
        status: result.status,
        nextTurnId: result.nextTurnId,
      });

      if (result.status === "finished") {
        io.to(room).emit("match:end", {
          matchId,
          winnerId: result.winnerId,
          isDraw: result.isDraw,
          boardState: result.boardState,
        });

        await finalizeMatch(matchId, result.winnerId, result.isDraw!);
      }

      if (callback) callback({ success: true });
    } catch (error) {
      console.error("[move:submit]", error);
      socket.emit("move:rejected", { matchId, error: "Internal error" });
      if (callback) callback({ error: "Internal error" });
    }
  });

  socket.on("chat:message", async ({ matchId, content, isGlobal }: { matchId?: string; content: string; isGlobal?: boolean }, callback) => {
    try {
      const sanitized = content.trim().substring(0, 500);
      if (!sanitized) return;

      const message = await prisma.message.create({
        data: {
          senderId: userId,
          content: sanitized,
          isGlobal: isGlobal ?? !matchId,
          matchId: matchId || null,
        },
      });

      const payload = {
        id: message.id,
        content: message.content,
        senderId: userId,
        username: user.username,
        rank: user.rank,
        createdAt: message.createdAt.toISOString(),
      };

      if (matchId) {
        io.to(`match:${matchId}`).emit("chat:message", payload);
      } else {
        io.emit("chat:message", payload);
      }

      if (callback) callback({ success: true });
    } catch (error) {
      console.error("[chat:message]", error);
    }
  });

  socket.on("typing:start", ({ matchId }: { matchId?: string }) => {
    if (matchId) {
      socket.to(`match:${matchId}`).emit("typing:start", { userId, username: user.username, matchId });
    }
  });

  socket.on("typing:stop", ({ matchId }: { matchId?: string }) => {
    if (matchId) {
      socket.to(`match:${matchId}`).emit("typing:stop", { userId, username: user.username, matchId });
    }
  });

  socket.on("spectator:join", async ({ matchId }: { matchId: string }) => {
    const match = await loadMatch(matchId);
    if (!match) {
      socket.emit("error", { message: "Match not found" });
      return;
    }
    socket.join(`match:${matchId}`);
    socket.to(`match:${matchId}`).emit("spectator:join", { userId, username: user.username });
    const room = io.sockets.adapter.rooms.get(`match:${matchId}`);
    const spectatorCount = room ? room.size - 2 : 0;
    io.to(`match:${matchId}`).emit("spectator:count", {
      matchId,
      count: Math.max(0, spectatorCount),
    });
  });

  socket.on("spectator:leave", ({ matchId }: { matchId: string }) => {
    socket.leave(`match:${matchId}`);
    socket.to(`match:${matchId}`).emit("spectator:leave", { userId, username: user.username });
  });

  socket.on("disconnect", async () => {
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(userId);
        await removeOnlineUser(userId);
        await setUserPresence(userId, { userId, username: user.username, status: "offline", lastSeen: new Date().toISOString() }, 60);
        io.emit("presence:update", { userId, username: user.username, status: "offline" });
      }
    }
    socketUsers.delete(socket.id);
    console.log(`[disconnect] ${user.username} (${userId}) - socket ${socket.id}`);
  });
});

httpServer.listen(config.port, () => {
  console.log(`[socket] Server listening on port ${config.port}`);
  console.log(`[socket] Redis: ${config.redisUrl}`);
  console.log(`[socket] CORS: ${config.corsOrigin}`);
});

process.on("SIGTERM", async () => {
  console.log("[socket] SIGTERM received, shutting down...");
  io.close();
  redis.disconnect();
  redisSub.disconnect();
  process.exit(0);
});
