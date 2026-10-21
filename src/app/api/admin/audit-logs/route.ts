import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'audit.logs.read' as Permission });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { category, action, take = '50', skip = '0' } = Object.fromEntries(
      (request as any).url ? new URL(request.url).searchParams : []
    );

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(action ? { action: { contains: action } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(take, 10) || 50,
      skip: parseInt(skip, 10) || 0,
    });

    return NextResponse.json({ logs, actorId: actor.userId });
  } catch (err) {
    console.error('GET /admin/audit-logs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
