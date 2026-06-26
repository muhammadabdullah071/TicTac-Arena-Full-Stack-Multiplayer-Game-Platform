/**
 * Lightweight session helper for API route files.
 * Uses getToken (JWT-only) to avoid importing argon2/bcrypt which
 * are native modules and crash Vite's SSR module runner at startup.
 */
import { getToken } from '@auth/core/jwt';

export async function getSession(request) {
  try {
    const isSecure = process.env.AUTH_URL?.startsWith('https') ?? false;
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: isSecure,
    });
    if (!token) return null;
    return {
      user: {
        id: token.sub,
        email: token.email,
        name: token.name,
        image: token.picture,
      },
    };
  } catch {
    return null;
  }
}
