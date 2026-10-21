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

    const inspections = await prisma.inspectionReport.findMany({
      where: { status: 'SUBMITTED' },
      orderBy: { submittedAt: 'asc' },
      include: { startup: { select: { name: true } }, agent: { include: { user: { select: { name: true } } } } },
    });
    return NextResponse.json(inspections);
  } catch (err) {
    console.error('GET /admin/inspections error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
