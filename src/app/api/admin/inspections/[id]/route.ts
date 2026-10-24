import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import { notifyAdmin } from '@/lib/alerts';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/notify';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'inspections.reports.review' as Permission });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { id } = await params;
    const { approve } = await request.json();
    const insp = await prisma.inspectionReport.findUnique({ where: { id: parseInt(id) }, include: { startup: true } });
    if (!insp) return NextResponse.json({ error: 'Inspection not found.' }, { status: 404 });

    if (approve) {
      await prisma.inspectionReport.update({
        where: { id: parseInt(id) },
        data: { status: 'APPROVED', approvedAt: new Date(), adminReviewedBy: actor.userId },
      });
      await prisma.startup.update({
        where: { id: insp.startupId },
        data: { badgeTier: 'FIELD_VERIFIED', inspectionScore: insp.overallScore, lastInspectedAt: new Date() },
      });
      await notifyUser(insp.startup.founderId, 'Inspection Approved! 🎉',
        `${insp.startup.name} is now Field Verified. The badge is live on your public profile.`,
        `/startups/${insp.startupId}`);
    } else {
      await prisma.inspectionReport.update({
        where: { id: parseInt(id) },
        data: { status: 'REJECTED', adminReviewedBy: actor.userId },
      });
      await notifyUser(insp.startup.founderId, 'Inspection Not Approved',
        `Your inspection report for ${insp.startup.name} was not approved. You can request a new inspection after reviewing the feedback.`,
        `/dashboard/startups/${insp.startupId}/manage`);
    }
    return NextResponse.json({ message: approve ? 'Approved and badge issued.' : 'Rejected.' });
  } catch (err) {
    console.error('PATCH /admin/inspections/[id] error:', err);
    await notifyAdmin('PATCH /admin/inspections/[id] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
