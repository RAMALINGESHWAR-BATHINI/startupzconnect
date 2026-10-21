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
    if (!decoded || decoded.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const reports = await prisma.report.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { reporter: { select: { name: true, email: true } } },
    });

    // Enrich REVIEW reports with the underlying review text so admins don't have to look it up separately.
    const enriched = await Promise.all(reports.map(async (r) => {
      if (r.contentType === 'REVIEW') {
        const review = await prisma.startupReview.findUnique({
          where: { id: r.contentId },
          include: { startup: { select: { name: true } } },
        });
        return { ...r, review };
      }
      return r;
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('GET /admin/reports error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
