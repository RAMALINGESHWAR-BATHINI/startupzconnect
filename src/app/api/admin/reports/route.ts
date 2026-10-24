import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'reports.moderate' as Permission });
    if (auth instanceof NextResponse) return auth;

    const reports = await prisma.report.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { reporter: { select: { name: true, email: true } } },
    });

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
