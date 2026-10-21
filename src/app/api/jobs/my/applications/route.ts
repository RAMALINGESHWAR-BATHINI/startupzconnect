import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const applications = await prisma.jobApplication.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: 'desc' },
      include: { job: { include: { startup: { select: { name: true } } } } },
    });
    return NextResponse.json(applications);
  } catch (err) {
    console.error('GET /jobs/my/applications error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
