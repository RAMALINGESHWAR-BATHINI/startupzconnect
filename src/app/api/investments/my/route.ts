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

    const interests = await prisma.investmentInterest.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: 'desc' },
      include: { startup: { select: { id: true, name: true, domain: true } } },
    });
    return NextResponse.json(interests);
  } catch (err) {
    console.error('GET /investments/my error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
