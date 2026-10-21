import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { revokeAllSessionsForUser } from '@/lib/sessions';
import { validatePassword } from '@/lib/password-policy';
import { consume, authKey } from '@/lib/rate-limit';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ip = (request.headers.get('x-forwarded-for') ?? request.headers.get('cf-connecting-ip') ?? null);

    // Per-user rate limit on password changes (fail closed).
    const rl = await consume(authKey(String(decoded.id), ip, 'password-change'), { failClosed: true, limit: 3, windowSeconds: 60 * 15 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many password change attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds ?? 900) } }
      );
    }

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

    // Password policy on the new password.
    const pwCheck = validatePassword(newPassword, { email: user.email, name: user.name });
    if (!pwCheck.ok) {
      return NextResponse.json({ error: pwCheck.errors.join(' ') }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    // Update password and revoke ALL sessions so every other device is forced to re-login.
    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashed, failedLoginAttempts: 0, lockedUntil: null },
    });
    await revokeAllSessionsForUser(decoded.id);

    return NextResponse.json({ message: 'Password updated successfully. All other sessions have been logged out.' });
  } catch (err) {
    console.error('PUT /auth/password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
