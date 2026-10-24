import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { isEmailVerified } from '@/lib/guards';
import { consume, authKey } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim();
    const subject = (body.subject || '').trim();
    const message = (body.message || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Invalid email.' }, { status: 400 });
    if (!message || message.length < 10 || message.length > 2000) return NextResponse.json({ error: 'Message must be 10-2000 chars.' }, { status: 400 });

    // rate limit by ip
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await consume(authKey(email, ip, 'contact'), { limit: 5, windowSeconds: 15 * 60 });
    if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

    // If email provider configured, send; otherwise log
    console.log('Contact form submission:', { email, subject, message: message.slice(0, 100) });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /contact error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
