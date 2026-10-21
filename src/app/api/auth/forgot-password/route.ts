import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken, hoursFromNow } from '@/lib/tokens';
import { sendMail } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    // Always return the same message whether or not the account exists — prevents user enumeration.
    const genericResponse = NextResponse.json({ message: 'If an account exists for that email, a reset link has been sent.' });
    if (!user) return genericResponse;

    const resetToken = generateToken();
    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpires: hoursFromNow(1) } });

    const resetUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/reset-password?token=${resetToken}`;
    await sendMail(user.email, 'Reset your StartupzConnect password',
      `Hi ${user.name},\n\nWe received a request to reset your password. Open this link to choose a new one:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`);

    return genericResponse;
  } catch (err) {
    console.error('POST /auth/forgot-password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
