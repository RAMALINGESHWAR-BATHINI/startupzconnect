import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({ where: { userId: decoded.id, isRead: false } });

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error('GET /notifications error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
