import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

function getAccessSecret(): string {
  if (!ACCESS_TOKEN_SECRET) throw new Error('Missing ACCESS_TOKEN_SECRET environment variable');
  return ACCESS_TOKEN_SECRET;
}

function getRefreshSecret(): string {
  if (!REFRESH_TOKEN_SECRET) throw new Error('Missing REFRESH_TOKEN_SECRET environment variable');
  return REFRESH_TOKEN_SECRET;
}

export const signAccessToken = (payload: object) => {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: '15m' });
};

export const signRefreshToken = (payload: object) => {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, getAccessSecret());
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, getRefreshSecret());
  } catch {
    return null;
  }
};

const isProd = process.env.NODE_ENV === 'production';

// Attach auth cookies directly onto a NextResponse object (Fix #1)
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
