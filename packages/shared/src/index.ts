export const SOCKET_EVENTS = {
  PLAYER_CONNECTED: "player:connected",
  PLAYER_DISCONNECTED: "player:disconnected",
  PRESENCE_UPDATE: "presence:update",
  QUEUE_JOIN: "queue:join",
  QUEUE_LEAVE: "queue:leave",
  MATCH_FOUND: "match:found",
  MATCH_START: "match:start",
  MOVE_SUBMIT: "move:submit",
  MOVE_ACCEPTED: "move:accepted",
  MOVE_REJECTED: "move:rejected",
  MATCH_UPDATE: "match:update",
  MATCH_END: "match:end",
  CHAT_MESSAGE: "chat:message",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  SPECTATOR_JOIN: "spectator:join",
  SPECTATOR_LEAVE: "spectator:leave",
  QUEUE_STATUS: "queue:status",
  FRIEND_ONLINE: "friend:online",
  FRIEND_OFFLINE: "friend:offline",
  FRIEND_CHALLENGE: "friend:challenge",
  TOURNAMENT_UPDATE: "tournament:update",
  NOTIFICATION: "notification",
  ERROR: "error",
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

export interface PlayerPresence {
  userId: string;
  username: string;
  status: "online" | "away" | "in_game" | "offline";
  currentMatchId?: string;
  lastSeen: string;
}

export interface MatchState {
  id: string;
  mode: string;
  status: string;
  board: (string | null)[];
  moves: MoveRecord[];
  currentTurnId: string | null;
  playerXId: string;
  playerOId: string | null;
  playerXUsername: string;
  playerOUsername: string | null;
  winningLine: number[] | null;
  winnerId: string | null;
  isDraw: boolean;
}

export interface MoveRecord {
  position: number;
  symbol: string;
  moveNumber: number;
}

export interface QueueJoinPayload {
  mode: string;
}

export interface MoveSubmitPayload {
  matchId: string;
  position: number;
}

export interface ChatMessagePayload {
  matchId?: string;
  content: string;
  isGlobal?: boolean;
}

export interface SpectatorPayload {
  matchId: string;
}

export interface GameResult {
  winner: string | null;
  winningLine: number[] | null;
}

export const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

export function checkGameState(board: (string | null)[]): GameResult {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: [...pattern] };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: "draw", winningLine: null };
  }
  return { winner: null, winningLine: null };
}

export function calculateElo(playerElo: number, opponentElo: number, result: "win" | "loss" | "draw"): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actual = result === "win" ? 1 : result === "draw" ? 0.5 : 0;
  return Math.round(K * (actual - expected));
}

export function calculateXp(result: "win" | "loss" | "draw", mode: string): number {
  const baseXP: Record<string, number> = {
    ranked: 50, casual: 25, ai: 30, tournament: 100, ultimate: 75,
  };
  let xp = baseXP[mode] || 25;
  if (result === "win") xp *= 2;
  else if (result === "draw") xp *= 0.5;
  else xp *= 0.2;
  return Math.floor(xp);
}

export function getRankFromElo(elo: number): string {
  if (elo >= 2400) return "Legend";
  if (elo >= 2000) return "Master";
  if (elo >= 1700) return "Diamond";
  if (elo >= 1400) return "Platinum";
  if (elo >= 1100) return "Gold";
  if (elo >= 800) return "Silver";
  return "Bronze";
}

export const RANK_COLORS: Record<string, string> = {
  Bronze: "text-[#CD7F32]", Silver: "text-[#C0C0C0]", Gold: "text-[#FFD700]",
  Platinum: "text-[#E5E4E2]", Diamond: "text-[#B9F2FF]", Master: "text-[#9370DB]",
  Legend: "text-[#FF6B6B]",
};
