import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken, hoursFromNow } from '@/lib/tokens';
import { sendMail } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

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
