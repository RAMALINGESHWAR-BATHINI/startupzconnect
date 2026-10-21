import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyTokenPurpose,
} from '@/lib/auth';

const ACCESS_SECRET = 'test-access-secret';
const REFRESH_SECRET = 'test-refresh-secret';

const origAccess = process.env.ACCESS_TOKEN_SECRET;
const origRefresh = process.env.REFRESH_TOKEN_SECRET;

beforeEach(() => {
  process.env.ACCESS_TOKEN_SECRET = ACCESS_SECRET;
  process.env.REFRESH_TOKEN_SECRET = REFRESH_SECRET;
});

afterEach(() => {
  process.env.ACCESS_TOKEN_SECRET = origAccess;
  process.env.REFRESH_TOKEN_SECRET = origRefresh;
});

describe('JWT algorithm pinning', () => {
  it('rejects alg: none tokens on access token verify', () => {
    const noneToken = jwt.sign({ id: 1, purpose: 'access' }, '', { algorithm: 'none' as any });
    expect(verifyAccessToken(noneToken)).toBeNull();
  });

  it('rejects tokens signed with wrong secret', () => {
    const token = jwt.sign({ id: 1, purpose: 'access' }, 'wrong-secret', { algorithm: 'HS256' });
    expect(verifyAccessToken(token)).toBeNull();
  });

  it('rejects expired tokens', () => {
    const expired = jwt.sign({ id: 1, purpose: 'access', exp: Math.floor(Date.now() / 1000) - 100 }, ACCESS_SECRET, { algorithm: 'HS256' });
    expect(verifyAccessToken(expired)).toBeNull();
  });

  it('rejects tampered tokens', () => {
    const token = signAccessToken({ id: 1 });
    const tampered = token.slice(0, -5) + 'xxxxx';
    expect(verifyAccessToken(tampered)).toBeNull();
  });

  it('rejects access token used as refresh token (purpose mismatch)', () => {
    const access = signAccessToken({ id: 1 });
    expect(verifyRefreshToken(access)).toBeNull();
  });

  it('rejects refresh token used as access token (purpose mismatch)', () => {
    const refresh = signRefreshToken({ id: 1 });
    expect(verifyAccessToken(refresh)).toBeNull();
  });

  it('accepts valid HS256 access token', () => {
    const token = signAccessToken({ id: 1, email: 'test@test.com', role: 'USER' });
    const decoded = verifyAccessToken(token);
    expect(decoded).not.toBeNull();
    expect(verifyTokenPurpose(decoded, 'access')).toBe(true);
    expect(decoded?.id).toBe(1);
  });

  it('accepts valid HS256 refresh token', () => {
    const token = signRefreshToken({ id: 1 });
    const decoded = verifyRefreshToken(token);
    expect(decoded).not.toBeNull();
    expect(verifyTokenPurpose(decoded, 'refresh')).toBe(true);
  });
});
