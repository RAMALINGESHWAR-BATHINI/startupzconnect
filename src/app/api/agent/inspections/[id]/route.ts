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

    const agent = await prisma.fieldAgent.findUnique({ where: { userId: decoded.id } });
    if (!agent) return NextResponse.json({ error: 'Not a field agent.' }, { status: 403 });

    const insp = await prisma.inspectionReport.findUnique({
      where: { id: parseInt(id) },
      include: { startup: true },
    });
    if (!insp || insp.agentId !== agent.id) return NextResponse.json({ error: 'Inspection not found.' }, { status: 404 });
    return NextResponse.json(insp);
  } catch (err) {
    console.error('GET /agent/inspections/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const agent = await prisma.fieldAgent.findUnique({ where: { userId: decoded.id } });
    if (!agent) return NextResponse.json({ error: 'Not a field agent.' }, { status: 403 });

    const insp = await prisma.inspectionReport.findUnique({ where: { id: parseInt(id) } });
    if (!insp || insp.agentId !== agent.id) return NextResponse.json({ error: 'Inspection not found.' }, { status: 404 });

    const { legitimacyScore, teamScore, productScore, workspaceScore, momentumScore, overallScore, agentNotes, recommendedBadge, status } = await request.json();

    for (const s of [legitimacyScore, teamScore, productScore, workspaceScore, momentumScore]) {
      if (s !== undefined && (s < 1 || s > 10)) return NextResponse.json({ error: 'Scores must be between 1 and 10.' }, { status: 400 });
    }

    const updated = await prisma.inspectionReport.update({
      where: { id: parseInt(id) },
      data: {
        legitimacyScore, teamScore, productScore, workspaceScore, momentumScore, overallScore,
        agentNotes: agentNotes?.trim() || null, recommendedBadge, status: status || 'SUBMITTED',
        visitedAt: new Date(), submittedAt: new Date(),
      },
    });

    await prisma.fieldAgent.update({ where: { id: agent.id }, data: { totalVisits: { increment: 1 } } });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /agent/inspections/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
