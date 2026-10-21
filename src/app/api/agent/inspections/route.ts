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

    const agent = await prisma.fieldAgent.findUnique({ where: { userId: decoded.id } });
    if (!agent) return NextResponse.json({ error: 'You are not registered as a field agent.' }, { status: 403 });

    const inspections = await prisma.inspectionReport.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
      include: { startup: { select: { name: true, operationalAddress: true, registeredAddress: true } } },
    });
    return NextResponse.json(inspections);
  } catch (err) {
    console.error('GET /agent/inspections error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
