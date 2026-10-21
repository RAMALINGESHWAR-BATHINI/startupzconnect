import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'data.database_health.read' as Permission });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const userCount = await prisma.user.count();
    const startupCount = await prisma.startup.count();
    const exportRequests = await prisma.approvalRequest.count({ where: { type: 'DATA_EXPORT' } });

    return NextResponse.json({
      databaseHealth: { status: 'ok', connected: true },
      userCount,
      startupCount,
      pendingExports: exportRequests,
      note: 'Real-time retention/backup status requires Cloudflare configuration.',
    });
  } catch (err) {
    console.error('GET /admin/data error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
