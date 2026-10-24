import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/notify';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'reports.moderate' as Permission });
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const { action } = await request.json(); // 'remove_content' | 'dismiss'
    const report = await prisma.report.findUnique({ where: { id: parseInt(id) } });
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    if (action === 'remove_content') {
      if (report.contentType === 'REVIEW') {
        const review = await prisma.startupReview.findUnique({ where: { id: report.contentId }, include: { startup: { select: { name: true } } } });
        await prisma.startupReview.delete({ where: { id: report.contentId } }).catch(() => {});
        if (review) {
          await notifyUser(review.userId, 'Your Review Was Removed',
            `Your review of ${review.startup.name} was removed for violating our content policy.`, '/terms');
        }
      }
      await prisma.report.update({ where: { id: report.id }, data: { status: 'ACTIONED' } });
    } else {
      if (report.contentType === 'REVIEW') {
        await prisma.startupReview.update({
          where: { id: report.contentId },
          data: { isFlagged: false, flagReason: null },
        }).catch(() => {});
      }
      await prisma.report.update({ where: { id: report.id }, data: { status: 'DISMISSED' } });
    }

    return NextResponse.json({ message: 'Report resolved.' });
  } catch (err) {
    console.error('PATCH /admin/reports/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
