import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { auditLog } from '@/lib/admin-auth';
import { isAdminRole, type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.approvals.read' as Permission });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const grants = await prisma.adminRoleAssignment.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ grants });
  } catch (err) {
    console.error('GET /admin/grants error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.roles.assign' as Permission, sensitive: true });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { userId, role, expiresAt } = await request.json();
    if (!userId || !role || !isAdminRole(role)) {
      return NextResponse.json({ error: 'Valid userId and role are required.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    // Sensitive roles need approval — create an ApprovalRequest instead of assigning directly.
    const SENSITIVE_ROLES: string[] = ['GLOBAL_ADMIN', 'SEC_ADMIN', 'DATA_ADMIN'];
    if (SENSITIVE_ROLES.includes(role)) {
      const approval = await prisma.approvalRequest.create({
        data: {
          type: 'ROLE_ASSIGNMENT',
          status: 'PENDING',
          requestedById: actor.userId,
          reason: `Temporary grant of ${role} role`,
          payload: JSON.stringify({ userId, role, expiresAt: expiresAt ?? null }),
          expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      await auditLog({
        actorId: actor.userId,
        actorLabel: actor.email,
        category: 'APPROVAL',
        action: 'grant.request',
        severity: 'INFO',
        outcome: 'SUCCESS',
        targetType: 'user',
        targetId: String(userId),
        ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined,
        metadata: { role, approvalId: approval.id, expiresAt },
      });
      return NextResponse.json({ message: `Grant request for ${role} submitted for approval.`, approvalId: approval.id });
    }

    const assignment = await prisma.adminRoleAssignment.create({
      data: { userId, role, grantedById: actor.userId },
    });

    await auditLog({
      actorId: actor.userId,
      actorLabel: actor.email,
      category: 'ADMIN_ACTION',
      action: 'grant.create',
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'user',
      targetId: String(userId),
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined,
      metadata: { role, expiresAt, targetUserId: userId },
    });

    return NextResponse.json({ assignment, message: `Role ${role} granted.` });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'User already has this role assigned.' }, { status: 400 });
    }
    console.error('POST /admin/grants error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.roles.assign' as Permission, sensitive: true });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { userId, role } = await request.json();
    if (!userId || !role || !isAdminRole(role)) {
      return NextResponse.json({ error: 'Valid userId and role are required.' }, { status: 400 });
    }

    // Prevent removing the last GLOBAL_ADMIN.
    if (role === 'GLOBAL_ADMIN') {
      const count = await prisma.adminRoleAssignment.count({ where: { role: 'GLOBAL_ADMIN' } });
      if (count <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last GLOBAL_ADMIN assignment.' }, { status: 403 });
      }
    }

    await prisma.adminRoleAssignment.delete({ where: { userId_role: { userId, role } } });

    await auditLog({
      actorId: actor.userId,
      actorLabel: actor.email,
      category: 'ADMIN_ACTION',
      action: 'grant.revoke',
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'user',
      targetId: String(userId),
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined,
      metadata: { role, targetUserId: userId },
    });

    return NextResponse.json({ message: `Role ${role} revoked.` });
  } catch (err) {
    console.error('DELETE /admin/grants error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
