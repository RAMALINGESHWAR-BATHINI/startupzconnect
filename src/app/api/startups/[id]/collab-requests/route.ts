import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(id) } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requests = await prisma.collaborationRequest.findMany({
      where: { startupId: startup.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        fromStartup: { select: { id: true, name: true, domain: true, badgeTier: true } },
      },
    });
    return NextResponse.json(requests);
  } catch (err) {
    console.error('GET /collab-requests error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
