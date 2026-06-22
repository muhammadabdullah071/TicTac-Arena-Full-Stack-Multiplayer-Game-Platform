import { neon } from '@neondatabase/serverless';

// Create a proxy that returns empty arrays for all SQL calls when DB is unavailable
const createMockSql = () => {
  const mockFn = (...args) => Promise.resolve([]);
  mockFn.transaction = (...args) => Promise.resolve([]);
  const proxy = new Proxy(mockFn, {
    apply: (target, thisArg, args) => Promise.resolve([]),
    get: (target, prop) => {
      if (prop === 'transaction') return () => Promise.resolve([]);
      return target[prop];
    }
  });
  return proxy;
};

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : createMockSql();

export default sql;
