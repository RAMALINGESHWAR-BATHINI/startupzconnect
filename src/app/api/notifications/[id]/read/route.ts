import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const n = await prisma.notification.findUnique({ where: { id: parseInt(id) } });
    if (!n || n.userId !== decoded.id) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    await prisma.notification.update({ where: { id: n.id }, data: { isRead: true } });
    return NextResponse.json({ message: 'Marked as read.' });
  } catch (err) {
    console.error('POST /notifications/[id]/read error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
