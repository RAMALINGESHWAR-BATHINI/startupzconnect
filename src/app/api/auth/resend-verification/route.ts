import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken, hoursFromNow } from '@/lib/tokens';
import { sendMail } from '@/lib/mailer';
import { consume, authKey } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';

export async function POST(request: Request) {
  try {
    const { email, turnstileToken } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const ip = (request.headers.get('x-forwarded-for') ?? request.headers.get('cf-connecting-ip') ?? null);

    // Rate limit per email + per IP (fail closed).
    const rl = await consume(authKey(email, ip, 'resend-verification'), { failClosed: true });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many verification requests. Please try again later.' },
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

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    // Always return success to avoid leaking which emails are registered.
    if (!user || user.emailVerified) {
      return NextResponse.json({ message: 'If an unverified account exists for that email, a new link has been sent.' });
    }

    const emailVerifyToken = generateToken();
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken, emailVerifyExpires: hoursFromNow(24) } });

    const verifyUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/verify-email?token=${emailVerifyToken}`;
    await sendMail(user.email, 'Verify your StartupzConnect email',
      `Hi ${user.name},\n\nHere's your new verification link:\n${verifyUrl}\n\nThis link expires in 24 hours.`);

    return NextResponse.json({ message: 'If an unverified account exists for that email, a new link has been sent.' });
  } catch (err) {
    console.error('POST /auth/resend-verification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
