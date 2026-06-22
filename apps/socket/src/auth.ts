import jwt from "jsonwebtoken";
import { config } from "./config.js";

export interface SocketUser {
  userId: string;
  username: string;
  rank: string;
  elo: number;
}

export function verifyToken(token: string): SocketUser | null {
  try {
    const decoded = jwt.verify(token, config.authSecret) as Record<string, unknown>;
    return {
      userId: decoded.sub as string || (decoded.id as string),
      username: (decoded.name as string) || "Unknown",
      rank: (decoded.rank as string) || "Bronze",
      elo: (decoded.elo as number) || 1000,
    };
  } catch {
    return null;
  }
}
