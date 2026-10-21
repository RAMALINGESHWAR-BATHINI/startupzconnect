import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { validatePassword } from '@/lib/password-policy';
import { revokeAllSessionsForUser } from '@/lib/sessions';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { resetToken: token } });
    if (!user) return NextResponse.json({ error: 'Invalid or already-used reset link.' }, { status: 400 });
    if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    // Password policy on the new password.
    const pwCheck = validatePassword(newPassword, { email: user.email, name: user.name });
    if (!pwCheck.ok) {
      return NextResponse.json({ error: pwCheck.errors.join(' ') }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Invalidate all sessions so the attacker's existing session (if any) is killed.
    await revokeAllSessionsForUser(user.id);

    return NextResponse.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    console.error('POST /auth/reset-password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
