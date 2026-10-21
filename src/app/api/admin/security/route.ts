import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { auditLog } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'security.events.read' as Permission });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const incidents = await prisma.securityIncident.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const sessionCount = await prisma.session.count({ where: { revokedAt: null } });
    const failedLogins = await prisma.auditLog.count({
      where: { category: 'AUTHZ_FAILURE', outcome: 'DENIED' },
    });

    return NextResponse.json({
      incidents,
      activeSessions: sessionCount,
      recentAuthFailures: failedLogins,
    });
  } catch (err) {
    console.error('GET /admin/security error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'security.incidents.manage' as Permission, sensitive: true });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { title, description, severity } = await request.json();
    if (!title || !description) return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });

    const incident = await prisma.securityIncident.create({
      data: { title, description, severity: severity || 'MEDIUM', createdById: actor.userId },
    });

    await auditLog({
      actorId: actor.userId,
      actorLabel: actor.email,
      category: 'SECURITY',
      action: 'incident.create',
      severity: severity || 'MEDIUM',
      outcome: 'SUCCESS',
      targetType: 'securityIncident',
      targetId: String(incident.id),
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined,
      metadata: { title, severity },
    });

    return NextResponse.json({ incident });
  } catch (err) {
    console.error('POST /admin/security error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
