import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.notification.updateMany({ where: { userId: decoded.id, isRead: false }, data: { isRead: true } });
    return NextResponse.json({ message: 'All marked as read.' });
  } catch (err) {
    console.error('POST /notifications/read-all error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
