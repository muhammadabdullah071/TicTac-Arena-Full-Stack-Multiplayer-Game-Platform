import { prisma } from "@tictac/database";
import { checkGameState } from "@tictac/shared";
import type { MoveRecord } from "@tictac/shared";

export async function loadMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      playerX: { select: { id: true, username: true, elo: true, rank: true } },
      playerO: { select: { id: true, username: true, elo: true, rank: true } },
    },
  });
  return match;
}

export async function processMove(matchId: string, userId: string, position: number) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.status !== "playing") {
    return { error: "Match not found or not active" };
  }
  if (match.currentTurnId !== userId) {
    return { error: "Not your turn" };
  }
  if (match.playerXId !== userId && match.playerOId !== userId) {
    return { error: "Not a participant" };
  }

  const boardState = match.boardState as { board: (string | null)[]; moves: MoveRecord[] };
  const board = boardState.board;
  if (board[position] !== null) {
    return { error: "Position already taken" };
  }

  const playerSymbol = match.playerXId === userId ? "X" : "O";
  const newBoard = [...board];
  newBoard[position] = playerSymbol;
  const moveNumber = (boardState.moves || []).length + 1;

  const gameResult = checkGameState(newBoard);
  const opponentId = match.playerXId === userId ? match.playerOId : match.playerXId;

  let newStatus = "playing";
  let winnerId: string | null = null;
  let isDraw = false;
  let finishedAt: Date | null = null;

  if (gameResult.winner === "draw") {
    newStatus = "finished";
    isDraw = true;
    finishedAt = new Date();
  } else if (gameResult.winner) {
    newStatus = "finished";
    winnerId = userId;
    finishedAt = new Date();
  }

  const moves = [
    ...(boardState.moves || []),
    { position, symbol: playerSymbol, moveNumber },
  ];

  const newBoardState = {
    board: newBoard,
    moves,
    winningLine: gameResult.winningLine,
  };

  await prisma.match.update({
    where: { id: matchId },
    data: {
      boardState: newBoardState,
      currentTurnId: newStatus === "finished" ? null : opponentId,
      status: newStatus as "playing" | "finished",
      winnerId,
      isDraw,
      finishedAt,
      lastMoveAt: new Date(),
    },
  });

  await prisma.move.create({
    data: {
      matchId,
      playerId: userId,
      position,
      moveNumber,
      boardSnapshot: newBoard,
    },
  });

  return {
    success: true,
    boardState: newBoardState,
    gameResult,
    status: newStatus,
    nextTurnId: newStatus === "finished" ? null : opponentId,
    winnerId,
    isDraw,
  };
}

export async function finalizeMatch(matchId: string, winnerId: string | null, isDraw: boolean) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      playerX: { select: { id: true, elo: true } },
      playerO: { select: { id: true, elo: true } },
    },
  });
  if (!match || !match.playerO) return;

  const playerXId = match.playerXId;
  const playerOId = match.playerOId!;

  const xpAwarded = 50;
  let eloChange = 0;

  if (match.mode === "ranked") {
    const K = 32;
    const expectedX = 1 / (1 + Math.pow(10, (match.playerO.elo - match.playerX.elo) / 400));
    const actualX = isDraw ? 0.5 : winnerId === playerXId ? 1 : 0;
    eloChange = Math.round(K * (actualX - expectedX));
  }

  const updateProfile = async (userId: string, result: "win" | "loss" | "draw") => {
    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) return;

    const eloDelta = result === "win" ? eloChange : result === "loss" ? -eloChange : 0;
    const newElo = match.mode === "ranked" ? Math.max(100, profile.elo + eloDelta) : profile.elo;
    const newRank = getRankFromElo(newElo);
    const coinsEarned = result === "win" ? 25 : result === "draw" ? 10 : 5;

    await prisma.profile.update({
      where: { id: userId },
      data: {
        elo: newElo,
        rank: newRank,
        xp: { increment: xpAwarded },
        level: Math.floor((profile.xp + xpAwarded) / 1000) + 1,
        coins: { increment: coinsEarned },
        totalMatches: { increment: 1 },
        totalWins: result === "win" ? { increment: 1 } : undefined,
        totalLosses: result === "loss" ? { increment: 1 } : undefined,
        totalDraws: result === "draw" ? { increment: 1 } : undefined,
        winStreak: result === "win" ? { increment: 1 } : 0,
        highestStreak: result === "win" && profile.winStreak + 1 > profile.highestStreak
          ? { increment: 1 }
          : undefined,
      },
    });
  };

  const p1Result = isDraw ? "draw" as const : winnerId === playerXId ? "win" as const : "loss" as const;
  const p2Result = isDraw ? "draw" as const : winnerId === playerOId ? "win" as const : "loss" as const;

  await Promise.all([
    updateProfile(playerXId, p1Result),
    updateProfile(playerOId, p2Result),
  ]);
}

function getRankFromElo(elo: number): string {
  if (elo >= 2400) return "Legend";
  if (elo >= 2000) return "Master";
  if (elo >= 1700) return "Diamond";
  if (elo >= 1400) return "Platinum";
  if (elo >= 1100) return "Gold";
  if (elo >= 800) return "Silver";
  return "Bronze";
}
