import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export interface SessionInput {
  userId: number;
  token: string; // raw refresh token; hashed before storage
  deviceInfo?: string | null;
  ip?: string | null;
  ttlDays?: number;
}

export interface SessionRecord {
  id: number;
  userId: number;
  tokenHash: string;
  deviceInfo: string | null;
  ip: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

/** Hash a refresh token before it ever touches the database. */
async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 12);
}

export async function createSession(input: SessionInput): Promise<SessionRecord> {
  const tokenHash = await hashToken(input.token);
  const expiresAt = new Date(Date.now() + (input.ttlDays ?? 7) * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash,
      deviceInfo: input.deviceInfo ?? null,
      ip: input.ip ?? null,
      expiresAt,
    },
  });

  return {
    id: session.id,
    userId: session.userId,
    tokenHash: session.tokenHash,
    deviceInfo: session.deviceInfo,
    ip: session.ip,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
  };
}

/** Validate a raw refresh token against a stored session hash. Returns the session if valid and active. */
export async function getSession(token: string): Promise<SessionRecord | null> {
  // Load all non-revoked, non-expired sessions for lookup. bcrypt compare requires per-row check.
  const sessions = await prisma.session.findMany({
    where: {
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  for (const s of sessions) {
    const match = await bcrypt.compare(token, s.tokenHash);
    if (match) {
      // Touch lastUsedAt
      await prisma.session.update({
        where: { id: s.id },
        data: { lastUsedAt: new Date() },
      });
      return {
        id: s.id,
        userId: s.userId,
        tokenHash: s.tokenHash,
        deviceInfo: s.deviceInfo,
        ip: s.ip,
        expiresAt: s.expiresAt,
        revokedAt: s.revokedAt,
        createdAt: s.createdAt,
        lastUsedAt: new Date(),
      };
    }
  }
  return null;
}

/** Revoke a single session by ID. */
export async function revokeSession(sessionId: number): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

/** Revoke all sessions for a user (used on password change / logout-all / disable). */
export async function revokeAllSessionsForUser(userId: number): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Revoke all sessions for a user except one (used on rotation). */
export async function revokeAllSessionsForUserExcept(userId: number, keepSessionId: number): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null, id: { not: keepSessionId } },
    data: { revokedAt: new Date() },
  });
}

/** List active sessions for a user (for the security dashboard / session management UI). */
export async function listActiveSessions(userId: number): Promise<SessionRecord[]> {
  const sessions = await prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  return sessions.map((s: any) => ({
    id: s.id,
    userId: s.userId,
    tokenHash: s.tokenHash,
    deviceInfo: s.deviceInfo,
    ip: s.ip,
    expiresAt: s.expiresAt,
    revokedAt: s.revokedAt,
    createdAt: s.createdAt,
    lastUsedAt: s.lastUsedAt,
  }));
}
