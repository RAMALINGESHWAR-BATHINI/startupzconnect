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
    if (!decoded || decoded.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const docs = await prisma.startupDocument.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { startup: { select: { name: true, registrationId: true } } },
    });
    return NextResponse.json(docs);
  } catch (err) {
    console.error('GET /admin/documents error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
