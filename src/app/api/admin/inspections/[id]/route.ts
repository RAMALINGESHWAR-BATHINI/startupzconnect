import { NextResponse } from 'next/server';
import { notifyAdmin } from '@/lib/alerts';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { notifyUser } from '@/lib/notify';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded || decoded.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { approve } = await request.json();
    const insp = await prisma.inspectionReport.findUnique({ where: { id: parseInt(id) }, include: { startup: true } });
    if (!insp) return NextResponse.json({ error: 'Inspection not found.' }, { status: 404 });

    if (approve) {
      await prisma.inspectionReport.update({
        where: { id: parseInt(id) },
        data: { status: 'APPROVED', approvedAt: new Date(), adminReviewedBy: decoded.id },
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
        data: { status: 'REJECTED', adminReviewedBy: decoded.id },
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
