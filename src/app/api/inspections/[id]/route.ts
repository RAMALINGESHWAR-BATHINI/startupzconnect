import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  return verifyAccessToken(token) as any;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decoded = await getUser();
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const report = await prisma.inspectionReport.findUnique({
      where: { id: parseInt(id) },
      include: {
        startup: { select: { id: true, name: true, founderId: true } },
        agent: { include: { user: { select: { name: true } } } },
      },
    });
    if (!report) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const isOwner = report.startup.founderId === decoded.id;
    const isAgentUser = report.agent.userId === decoded.id;
    const isAdmin = decoded.role === 'ADMIN';
    if (!isOwner && !isAgentUser && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Agent submits scores; admin approves
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decoded = await getUser();
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const report = await prisma.inspectionReport.findUnique({
      where: { id: parseInt(id) },
      include: { agent: true },
    });
    if (!report) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const isAgentUser = report.agent.userId === decoded.id;
    const isAdmin = decoded.role === 'ADMIN';
    if (!isAgentUser && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();

    // Agent submitting scores
    if (isAgentUser && body.action === 'submit') {
      const { legitimacyScore, teamScore, productScore, workspaceScore, momentumScore, agentNotes, recommendedBadge } = body;
      const scores = [legitimacyScore, teamScore, productScore, workspaceScore, momentumScore];
      if (scores.some(s => !s || s < 1 || s > 10)) return NextResponse.json({ error: 'All scores must be 1–10.' }, { status: 400 });

      const overall = scores.reduce((a, b) => a + b, 0) / scores.length;
      const updated = await prisma.inspectionReport.update({
        where: { id: parseInt(id) },
        data: {
          legitimacyScore, teamScore, productScore, workspaceScore, momentumScore,
          overallScore: Math.round(overall * 10) / 10,
          agentNotes: agentNotes?.trim() || null,
          recommendedBadge: recommendedBadge || null,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          visitedAt: new Date(),
        },
      });
      // Increment agent visit count
      await prisma.fieldAgent.update({ where: { id: report.agentId }, data: { totalVisits: { increment: 1 } } });
      return NextResponse.json(updated);
    }

    // Admin approving
    if (isAdmin && body.action === 'approve') {
      const { adminReviewNotes, badgeTier } = body;
      const updated = await prisma.inspectionReport.update({
        where: { id: parseInt(id) },
        data: { status: 'APPROVED', adminReviewNotes: adminReviewNotes?.trim() || null, approvedAt: new Date(), adminReviewedBy: decoded.id },
      });
      // Update startup badge
      if (badgeTier) {
        await prisma.startup.update({
          where: { id: report.startupId },
          data: { badgeTier, inspectionScore: report.overallScore, lastInspectedAt: new Date() },
        });
      }
      return NextResponse.json(updated);
    }

    // Admin rejecting
    if (isAdmin && body.action === 'reject') {
      const updated = await prisma.inspectionReport.update({
        where: { id: parseInt(id) },
        data: { status: 'FAILED', adminReviewNotes: body.adminReviewNotes?.trim() || null, adminReviewedBy: decoded.id },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('PATCH /inspections/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
