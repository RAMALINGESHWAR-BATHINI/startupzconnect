import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

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
        agent: { include: { user: { select: { id: true, name: true, investorVerificationStatus: true } } } },
      },
    });
    if (!report) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const isOwner = report.startup.founderId === decoded.id;
    const isAgentUser = report.agent && report.agent.userId === decoded.id;

    // Admin authorization via authorizeAdmin (never trust client/token roles).
    let isAdmin = false;
    if (!isOwner && !isAgentUser) {
      const auth = await authorizeAdmin(_req as any, { permission: 'inspections.reports.read' as Permission });
      if (!(auth instanceof NextResponse)) isAdmin = true;
    }

    // Verified investors may view inspection reports of startups they invest in.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { investorVerificationStatus: true },
    });
    const isVerifiedInvestor = user?.investorVerificationStatus === 'VERIFIED';
    const investorInterest = isVerifiedInvestor
      ? await prisma.investmentInterest.findUnique({
          where: { startupId_userId: { startupId: report.startupId, userId: decoded.id } },
        })
      : null;

    if (!isOwner && !isAgentUser && !isAdmin && !(isVerifiedInvestor && !!investorInterest)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Never expose anonymous reviewer identity; only return safe agent fields.
    const safeReport = {
      ...report,
      agent: report.agent
        ? { id: report.agent.id, city: report.agent.city, state: report.agent.state }
        : null,
    };

    return NextResponse.json(safeReport);
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

    const isAgentUser = report.agent && report.agent.userId === decoded.id;

    // Admin authorization via authorizeAdmin (never trust client/token roles).
    let isAdmin = false;
    const auth = await authorizeAdmin(request as any, { permission: 'inspections.reports.review' as Permission });
    if (!(auth instanceof NextResponse)) isAdmin = true;

    const body = await request.json();

    // Agent submitting scores — atomic, one-shot transition to SUBMITTED.
    if (isAgentUser && body.action === 'submit') {
      // Agents cannot approve or reject inspection reports.
      if (body.action === 'approve' || body.action === 'reject') {
        return NextResponse.json({ error: 'Agents cannot approve or reject inspection reports.' }, { status: 403 });
      }

      const { legitimacyScore, teamScore, productScore, workspaceScore, momentumScore, agentNotes, recommendedBadge } = body;
      const scores = [legitimacyScore, teamScore, productScore, workspaceScore, momentumScore];
      if (!scores.every((s: number) => typeof s === 'number' && s >= 1 && s <= 10)) {
        return NextResponse.json({ error: 'All scores must be 1–10.' }, { status: 400 });
      }

      // Atomic one-shot: only transition if still in a submittable state (prevents duplicate submissions).
      const updated = await prisma.inspectionReport.updateMany({
        where: {
          id: parseInt(id),
          status: { in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS'] },
          agentId: report.agentId,
        },
        data: {
          legitimacyScore, teamScore, productScore, workspaceScore, momentumScore,
          overallScore: Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10,
          agentNotes: agentNotes?.trim() || null,
          recommendedBadge: recommendedBadge || null,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          visitedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        return NextResponse.json({ error: 'Inspection is not in a submittable state or already submitted.' }, { status: 409 });
      }

      // Increment agent visit count.
      if (report.agentId) {
        await prisma.fieldAgent.update({ where: { id: report.agentId }, data: { totalVisits: { increment: 1 } } });
      }

      return NextResponse.json({ message: 'Inspection submitted.' });
    }

    // Admin approving — only from SUBMITTED state (state guard).
    if (isAdmin && body.action === 'approve') {
      if (report.status !== 'SUBMITTED') {
        return NextResponse.json({ error: 'Only submitted inspections can be approved.' }, { status: 409 });
      }
      const { adminReviewNotes, badgeTier } = body;
      const updated = await prisma.inspectionReport.update({
        where: { id: parseInt(id) },
        data: {
          status: 'APPROVED',
          adminReviewNotes: adminReviewNotes?.trim() || null,
          approvedAt: new Date(),
          adminReviewedBy: decoded.id,
        },
      });
      // Update startup badge.
      if (badgeTier) {
        await prisma.startup.update({
          where: { id: report.startupId },
          data: { badgeTier, inspectionScore: report.overallScore, lastInspectedAt: new Date() },
        });
      }
      return NextResponse.json(updated);
    }

    // Admin rejecting — only from SUBMITTED state.
    if (isAdmin && body.action === 'reject') {
      if (report.status !== 'SUBMITTED') {
        return NextResponse.json({ error: 'Only submitted inspections can be rejected.' }, { status: 409 });
      }
      const updated = await prisma.inspectionReport.update({
        where: { id: parseInt(id) },
        data: {
          status: 'FAILED',
          adminReviewNotes: body.adminReviewNotes?.trim() || null,
          adminReviewedBy: decoded.id,
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('PATCH /inspections/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
