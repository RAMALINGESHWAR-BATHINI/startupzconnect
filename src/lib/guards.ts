import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Email-verification guard. The legacy ADMIN exemption is removed — every
 * account (including administrators) must verify email before privileged
 * actions. Suspended accounts are rejected.
 */
export async function isEmailVerified(userId: number): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true, status: true } });
  if (!u) return false;
  return u.status === 'ACTIVE' && !!u.emailVerified;
}

export function unverifiedResponse() {
  return NextResponse.json(
    { error: 'Please verify your email address first. Check your inbox, or resend the link from Settings.' },
    { status: 403 }
  );
}

/** Reject suspended accounts with a clear message. */
export function suspendedResponse() {
  return NextResponse.json({ error: 'This account has been suspended. Contact support.' }, { status: 403 });
}

export async function assertActiveAndVerified(userId: number): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true, status: true } });
  if (!u) return { ok: false, response: NextResponse.json({ error: 'User not found.' }, { status: 404 }) };
  if (u.status !== 'ACTIVE') return { ok: false, response: suspendedResponse() };
  if (!u.emailVerified) return { ok: false, response: unverifiedResponse() };
  return { ok: true };
}
