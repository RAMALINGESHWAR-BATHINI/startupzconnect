import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, purpose, code } = await request.json();
    if (!email || !purpose || !code) return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    const record = await prisma.otpCode.findFirst({ where: { email, purpose, used: false }, orderBy: { createdAt: 'desc' } });
    if (!record) return NextResponse.json({ error: 'No OTP found' }, { status: 400 });
    if (record.expiresAt < new Date()) return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    if (record.attempts >= 5) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: record.attempts + 1 } });
    if (codeHash !== record.codeHash) return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('verify-otp error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
