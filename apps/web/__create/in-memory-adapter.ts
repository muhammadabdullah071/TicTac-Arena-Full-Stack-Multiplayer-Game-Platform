import { randomUUID } from 'node:crypto';
import type {
  Adapter,
  AdapterUser,
  AdapterSession,
  VerificationToken,
  AdapterAuthenticator,
} from '@auth/core/adapters';

interface StoredUser extends AdapterUser {
  accounts: {
    id: string;
    provider: string;
    providerAccountId: string;
    type: string;
    password?: string;
    [key: string]: unknown;
  }[];
}

const users = new Map<string, StoredUser>();
const accounts = new Map<string, any[]>();
const sessions = new Map<string, AdapterSession>();
const verificationTokens = new Map<string, VerificationToken>();
const authenticators = new Map<string, AdapterAuthenticator>();

function toAdapterUser(u: StoredUser): AdapterUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    image: u.image,
  };
}

export default function InMemoryAdapter(): Adapter & {
  getUserByEmail(email: string): Promise<StoredUser | null>;
  linkAccount(data: {
    userId: string;
    provider: string;
    providerAccountId: string;
    type: string;
    extraData?: Record<string, unknown>;
    [key: string]: unknown;
  }): Promise<void>;
} {
  return {
    async createUser(user) {
      const id = randomUUID();
      const stored: StoredUser = {
        id,
        name: user.name ?? null,
        email: user.email,
        emailVerified: user.emailVerified ?? null,
        image: user.image ?? null,
        accounts: [],
      };
      users.set(id, stored);
      return toAdapterUser(stored);
    },

    async getUser(id) {
      const u = users.get(id);
      return u ? toAdapterUser(u) : null;
    },

    async getUserByEmail(email) {
      for (const u of users.values()) {
        if (u.email === email) {
          const userAccounts = accounts.get(u.id) ?? [];
          return {
            ...u,
            accounts: userAccounts.map((a) => ({
              id: a.id,
              provider: a.provider,
              providerAccountId: a.providerAccountId,
              type: a.type,
              password: a.password,
            })),
          } as StoredUser;
        }
      }
      return null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      for (const [userId, accts] of accounts) {
        for (const a of accts) {
          if (a.provider === provider && a.providerAccountId === providerAccountId) {
            return users.get(userId) ?? null;
          }
        }
      }
      return null;
    },

    async updateUser(user) {
      const existing = users.get(user.id);
      if (!existing) throw new Error(`User ${user.id} not found`);
      const updated: StoredUser = {
        ...existing,
        ...user,
        accounts: existing.accounts,
      };
      users.set(user.id, updated);
      return toAdapterUser(updated);
    },

    async deleteUser(userId) {
      users.delete(userId);
      accounts.delete(userId);
    },

    async linkAccount(account) {
      const entry = {
        id: randomUUID(),
        userId: account.userId,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        type: account.type,
        password: account.extraData?.password,
        ...Object.fromEntries(
          Object.entries(account).filter(
            ([k]) => !['userId', 'provider', 'providerAccountId', 'type', 'extraData'].includes(k)
          )
        ),
      };
      const existing = accounts.get(account.userId) ?? [];
      existing.push(entry);
      accounts.set(account.userId, existing);
    },

    async unlinkAccount({ provider, providerAccountId }) {
      for (const [userId, accts] of accounts) {
        accounts.set(
          userId,
          accts.filter(
            (a) => !(a.provider === provider && a.providerAccountId === providerAccountId)
          )
        );
      }
    },

    async createSession(session) {
      sessions.set(session.sessionToken, session);
      return session;
    },

    async getSessionAndUser(sessionToken) {
      const session = sessions.get(sessionToken);
      if (!session) return null;
      const user = users.get(session.userId);
      if (!user) return null;
      return { session, user: toAdapterUser(user) };
    },

    async updateSession(session) {
      const existing = sessions.get(session.sessionToken);
      if (!existing) return null;
      const updated = { ...existing, ...session };
      sessions.set(session.sessionToken, updated);
      return updated;
    },

    async deleteSession(sessionToken) {
      sessions.delete(sessionToken);
    },

    async createVerificationToken(verificationToken) {
      const key = `${verificationToken.identifier}:${verificationToken.token}`;
      verificationTokens.set(key, verificationToken);
      return verificationToken;
    },

    async useVerificationToken({ identifier, token }) {
      const key = `${identifier}:${token}`;
      const vt = verificationTokens.get(key);
      verificationTokens.delete(key);
      return vt ?? null;
    },

    async getAccount(providerAccountId, provider) {
      for (const [, accts] of accounts) {
        for (const a of accts) {
          if (a.providerAccountId === providerAccountId && a.provider === provider) {
            return a;
          }
        }
      }
      return null;
    },

    getAuthenticator(credentialID) {
      return Promise.resolve(authenticators.get(credentialID) ?? null);
    },

    createAuthenticator(authenticator) {
      authenticators.set(authenticator.credentialID, authenticator);
      return Promise.resolve(authenticator);
    },

    listAuthenticatorsByUserId(userId) {
      return Promise.resolve(
        Array.from(authenticators.values()).filter((a) => a.userId === userId)
      );
    },

    updateAuthenticatorCounter(credentialID, newCounter) {
      const a = authenticators.get(credentialID);
      if (!a) throw new Error(`Authenticator ${credentialID} not found`);
      const updated = { ...a, counter: newCounter };
      authenticators.set(credentialID, updated);
      return Promise.resolve(updated);
    },
  };
}
