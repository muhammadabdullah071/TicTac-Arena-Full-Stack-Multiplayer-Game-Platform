import "@testing-library/jest-dom";
import { beforeAll, afterAll, afterEach } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret";
  process.env.DATABASE_URL = "postgresql://tictac:tictac_password@localhost:5432/tictac_arena_test";
  process.env.REDIS_URL = "redis://localhost:6379";
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {});

export {};
