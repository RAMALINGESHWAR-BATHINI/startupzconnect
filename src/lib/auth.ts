import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession, getSession, revokeSession, revokeAllSessionsForUser } from './sessions';

// Only HS256 is permitted — algorithm confusion / `alg:none` attacks are rejected at the verifier.
export const JWT_ALGORITHMS: jwt.Algorithm[] = ['HS256'];

function getAccessSecret(): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error('Missing ACCESS_TOKEN_SECRET environment variable');
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error('Missing REFRESH_TOKEN_SECRET environment variable');
  return secret;
}

/** Token purpose claim — every JWT carries a purpose so access/refresh tokens cannot be swapped. */
export type TokenPurpose = 'access' | 'refresh';

export const signAccessToken = (payload: object) => {
  return jwt.sign({ ...payload, purpose: 'access' }, getAccessSecret(), {
    algorithm: 'HS256',
    expiresIn: '15m',
    issuer: 'startupzconnect',
    audience: 'startupzconnect-api',
  });
};

export const signRefreshToken = (payload: object) => {
  return jwt.sign({ ...payload, purpose: 'refresh' }, getRefreshSecret(), {
    algorithm: 'HS256',
    expiresIn: '7d',
    issuer: 'startupzconnect',
    audience: 'startupzconnect-api',
  });
};

const baseVerifyOpts = {
  algorithms: [...JWT_ALGORITHMS],
  issuer: 'startupzconnect',
  audience: 'startupzconnect-api',
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, getAccessSecret(), { ...baseVerifyOpts }) as { purpose?: TokenPurpose; id?: number; email?: string; role?: string } | null;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, getRefreshSecret(), { ...baseVerifyOpts }) as { purpose?: TokenPurpose; id?: number } | null;
  } catch {
    return null;
  }
};

export function verifyTokenPurpose(decoded: unknown, expected: TokenPurpose): boolean {
  return typeof decoded === 'object' && decoded !== null && (decoded as Record<string, unknown>).purpose === expected;
}

const isProd = process.env.NODE_ENV === 'production';

export const attachAuthCookies = (response: NextResponse, accessToken: string, refreshToken: string) => {
  response.cookies.set('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 15 * 60,
    path: '/',
  });
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
};

export const clearAuthCookies = async () => {
  const cookieStore = await cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
};

/** Issue a new session row + cookies after login/refresh. Returns the session record. */
export async function issueAuthSession(
  user: { id: number; email: string; role: string },
  deviceInfo?: string,
  ip?: string
) {
  // The access token carries id/email/role so that route handlers can authorise
  // from the token alone. Keep this in sync with the refresh route.
  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  const session = await createSession({
    userId: user.id,
    token: refreshToken, // raw token; sessions.ts hashes it before storage
    deviceInfo,
    ip,
    ttlDays: 7,
  });

  return { accessToken, refreshToken, session };
}

export type { SessionRecord } from './sessions';
