import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded || decoded.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { action } = await request.json(); // 'remove_content' | 'dismiss'
    const report = await prisma.report.findUnique({ where: { id: parseInt(id) } });
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    if (action === 'remove_content') {
      if (report.contentType === 'REVIEW') {
        await prisma.startupReview.delete({ where: { id: report.contentId } }).catch(() => {});
      }
      await prisma.report.update({ where: { id: report.id }, data: { status: 'ACTIONED' } });
    } else {
      // Dismissing a report un-flags the underlying review if it was a review report.
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
