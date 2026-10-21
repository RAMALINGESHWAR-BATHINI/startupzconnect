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

    const [pendingInspections, pendingDocuments, pendingReports, totalStartups, totalUsers, institutionCount] = await Promise.all([
      prisma.inspectionReport.count({ where: { status: 'SUBMITTED' } }),
      prisma.startupDocument.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.startup.count(),
      prisma.user.count(),
      prisma.institutionPartner.count(),
    ]);

    return NextResponse.json({ pendingInspections, pendingDocuments, pendingReports, totalStartups, totalUsers, institutionCount });
  } catch (err) {
    console.error('GET /admin/summary error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
