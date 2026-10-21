import { NextResponse } from 'next/server';
import { notifyAdmin } from '@/lib/alerts';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signAccessToken, signRefreshToken, attachAuthCookies, issueAuthSession } from '@/lib/auth';
import { consume, authKey } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';

export async function POST(request: Request) {
  try {
    const { email, password, turnstileToken } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    const ip = (request.headers.get('x-forwarded-for') ?? request.headers.get('cf-connecting-ip') ?? null);

    // Rate limit per email + per IP (fail closed on DB error for this sensitive op).
    const rl = await consume(authKey(email, ip, 'login'), { failClosed: true });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds ?? 900) } }
      );
    }

    // Turnstile verification (fail closed once configured).
    if (process.env.TURNSTILE_SECRET_KEY) {
      const ts = await verifyTurnstile(turnstileToken, ip);
      if (!ts.ok) {
        return NextResponse.json({ error: 'Security check failed. Please try again.' }, { status: 400 });
      }
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Generic message to prevent user enumeration.
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Account lockout: 5 failed attempts locks the account for 15 minutes.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json({ error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` }, { status: 429 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= 5;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      if (shouldLock) {
        return NextResponse.json({ error: 'Too many failed attempts. Account locked for 15 minutes.' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Successful login clears any prior failed-attempt count.
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    }

    // Create a server-side session row (multi-device support) and set cookies.
    const { accessToken, refreshToken } = await issueAuthSession(user.id, undefined, ip ?? undefined);

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    attachAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (err) {
    console.error('Login error:', err);
    await notifyAdmin('Login error', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
