import { config as dotenvConfig } from "dotenv";
dotenvConfig();

export const config = {
  port: parseInt(process.env.SOCKET_PORT || "3001", 10),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  redisPrefix: process.env.REDIS_PREFIX || "tictac:",
  authSecret: process.env.AUTH_SECRET || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  pingInterval: parseInt(process.env.PING_INTERVAL || "25000", 10),
  pingTimeout: parseInt(process.env.PING_TIMEOUT || "20000", 10),
  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW || "5000", 10),
    maxMoves: parseInt(process.env.RATE_LIMIT_MAX_MOVES || "10", 10),
    maxMessages: parseInt(process.env.RATE_LIMIT_MAX_MESSAGES || "5", 10),
  },
};
