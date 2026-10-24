import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.dashboard.read' as Permission });
    if (auth instanceof NextResponse) return auth;

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
