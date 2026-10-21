import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: 'Verification token is required.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { emailVerifyToken: token } });
    if (!user) return NextResponse.json({ error: 'Invalid or already-used verification link.' }, { status: 400 });
    if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
      return NextResponse.json({ error: 'This verification link has expired. Please request a new one.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
    });

    return NextResponse.json({ message: 'Email verified successfully!' });
  } catch (err) {
    console.error('POST /auth/verify-email error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
