import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'inspections.reports.read' as Permission });
    if (auth instanceof NextResponse) return auth;

    const inspections = await prisma.inspectionReport.findMany({
      where: { status: 'SUBMITTED' },
      orderBy: { submittedAt: 'asc' },
      include: { startup: { select: { name: true } }, agent: { include: { user: { select: { name: true } } } } },
    });
    return NextResponse.json(inspections);
  } catch (err) {
    console.error('GET /admin/inspections error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
