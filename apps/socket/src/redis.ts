import Redis from "ioredis";
import { config } from "./config.js";

export const redis = new Redis(config.redisUrl, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
});

export const redisSub = new Redis(config.redisUrl, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

const prefix = config.redisPrefix;

export const RedisKeys = {
  userPresence: (userId: string) => `${prefix}presence:${userId}`,
  userSocket: (userId: string) => `${prefix}socket:${userId}`,
  matchRoom: (matchId: string) => `${prefix}match:${matchId}`,
  matchState: (matchId: string) => `${prefix}match:state:${matchId}`,
  queueKey: (mode: string) => `${prefix}queue:${mode}`,
  onlineUsers: () => `${prefix}online`,
  rateLimit: (userId: string, action: string) => `${prefix}ratelimit:${userId}:${action}`,
  cache: (key: string) => `${prefix}cache:${key}`,
};

export async function setUserPresence(userId: string, data: Record<string, unknown>, ttl = 300): Promise<void> {
  await redis.setex(RedisKeys.userPresence(userId), ttl, JSON.stringify(data));
}

export async function getUserPresence(userId: string): Promise<Record<string, unknown> | null> {
  const data = await redis.get(RedisKeys.userPresence(userId));
  return data ? JSON.parse(data) : null;
}

export async function addOnlineUser(userId: string): Promise<void> {
  await redis.sadd(RedisKeys.onlineUsers(), userId);
}

export async function removeOnlineUser(userId: string): Promise<void> {
  await redis.srem(RedisKeys.onlineUsers(), userId);
}

export async function getOnlineUsers(): Promise<string[]> {
  return redis.smembers(RedisKeys.onlineUsers());
}

export async function isUserOnline(userId: string): Promise<boolean> {
  return (await redis.sismember(RedisKeys.onlineUsers(), userId)) === 1;
}

export async function setCache(key: string, value: unknown, ttl = 60): Promise<void> {
  await redis.setex(RedisKeys.cache(key), ttl, JSON.stringify(value));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(RedisKeys.cache(key));
  return data ? JSON.parse(data) as T : null;
}

export async function invalidateCache(key: string): Promise<void> {
  await redis.del(RedisKeys.cache(key));
}

export async function checkRateLimit(userId: string, action: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const key = RedisKeys.rateLimit(userId, action);
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.pexpire(key, windowMs);
  }
  return current <= maxRequests;
}

export async function addToQueue(userId: string, mode: string, elo: number): Promise<void> {
  const entry = JSON.stringify({ userId, mode, elo, joinedAt: Date.now() });
  await redis.zadd(RedisKeys.queueKey(mode), elo, entry);
}

export async function removeFromQueue(userId: string, mode: string): Promise<void> {
  const queueKey = RedisKeys.queueKey(mode);
  const entries = await redis.zrange(queueKey, 0, -1);
  for (const entry of entries) {
    const parsed = JSON.parse(entry);
    if (parsed.userId === userId) {
      await redis.zrem(queueKey, entry);
      break;
    }
  }
}

export async function findMatch(mode: string, userId: string, elo: number, range = 300): Promise<{ userId: string; mode: string; elo: number } | null> {
  const queueKey = RedisKeys.queueKey(mode);
  const entries = await redis.zrangebyscore(queueKey, elo - range, elo + range);
  for (const entry of entries) {
    const parsed = JSON.parse(entry);
    if (parsed.userId !== userId) {
      await redis.zrem(queueKey, entry);
      return parsed;
    }
  }
  return null;
}
