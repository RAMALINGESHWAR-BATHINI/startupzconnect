/**
 * Fixed-window rate limiter backed by the `RateLimit` database table.
 *
 * Sensitive operations (login, register, forgot-password, resend-verification,
 * approvals, role assignments) call `consume`. If the DB is unavailable we fail
 * CLOSED for sensitive operations so we never silently allow unlimited attempts.
 *
 * Per-email and per-IP keys are used together; responses are intentionally
 * generic to reduce account enumeration.
 */

import prisma from '@/lib/prisma';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_SECONDS = 60 * 15; // 15 minutes

/**
 * Consume one unit from a fixed-window counter keyed by `key`.
 * `limit` = max requests per window; `windowSeconds` = window length.
 * Fails closed (allowed: false) when the database is unavailable for sensitive ops.
 */
export async function consume(
  key: string,
  opts: { limit?: number; windowSeconds?: number; failClosed?: boolean } = {}
): Promise<RateLimitResult> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const windowSeconds = opts.windowSeconds ?? DEFAULT_WINDOW_SECONDS;
  const failClosed = opts.failClosed ?? true;
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / 1000 / windowSeconds) * windowSeconds * 1000);

  try {
    const row = await prisma.rateLimit.findUnique({ where: { key } });

    if (!row || row.windowStart < windowStart) {
      // Start a fresh window (insert or reset).
      await prisma.rateLimit.upsert({
        where: { key },
        update: { count: 1, windowStart },
        create: { key, count: 1, windowStart },
      });
      return { allowed: true, remaining: limit - 1 };
    }

    if (row.count >= limit) {
      const retryAfter = Math.ceil((row.windowStart.getTime() + windowSeconds * 1000 - now.getTime()) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter > 0 ? retryAfter : 1 };
    }

    await prisma.rateLimit.update({
      where: { key },
      data: { count: row.count + 1 },
    });
    return { allowed: true, remaining: limit - (row.count + 1) };
  } catch (err) {
    // Database failure — fail closed for sensitive operations.
    if (failClosed) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: limit };
  }
}

/** Build a per-email + per-IP composite key. */
export function authKey(email: string | null, ip: string | null, action: string): string {
  const e = email ? email.toLowerCase().trim() : 'unknown';
  const i = ip ?? 'unknown';
  return `auth:${action}:${e}:${i}`;
}
