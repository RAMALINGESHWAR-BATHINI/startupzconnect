import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { notifyUser } from '@/lib/notify';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded || decoded.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { email, title, message } = await request.json();
    if (!email || !title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Email, title, and message are required.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!targetUser) return NextResponse.json({ error: 'No user found with that email.' }, { status: 404 });

    await notifyUser(targetUser.id, title.trim(), message.trim());
    return NextResponse.json({ message: `Notification sent to ${targetUser.name}.` });
  } catch (err) {
    console.error('POST /admin/notify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
