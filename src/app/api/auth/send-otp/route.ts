import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

const isProd = process.env.NODE_ENV === 'production';

function getTransport() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

export async function POST(request: Request) {
  try {
    const { email, purpose } = await request.json();
    if (!email || !purpose) return NextResponse.json({ error: 'email and purpose required' }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.otpCode.create({ data: { email, codeHash, purpose, expiresAt } });

    const transport = getTransport();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'startupzconnect@gmail.com';
    if (transport) {
      try {
        await transport.verify();
      } catch (verifyErr) {
        console.error('SMTP verify failed:', verifyErr);
        return NextResponse.json({ error: 'Email delivery failed.' }, { status: 500 });
      }
      await transport.sendMail({
        from: `StartupzConnect <${from}>`,
        to: email,
        subject: 'Your StartupzConnect OTP',
        text: `Your verification code is ${code}. It expires in 10 minutes.`,
        html: `<div style="font-family:sans-serif"><h2>StartupzConnect</h2><p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p></div>`,
      });
    } else if (!isProd) {
      console.log('OTP (dev only):', code, 'for', email, purpose);
    } else {
      return NextResponse.json({ error: 'Email delivery not configured.' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('send-otp error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
