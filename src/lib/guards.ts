import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/** ADMIN accounts are exempt (they're created manually, not via email signup). */
export async function isEmailVerified(userId: number, role?: string): Promise<boolean> {
  if (role === 'ADMIN') return true;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
  return !!u?.emailVerified;
}

export function unverifiedResponse() {
  return NextResponse.json(
    { error: 'Please verify your email address first. Check your inbox, or resend the link from Settings.' },
    { status: 403 }
  );
}
