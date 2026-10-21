import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { auditLog } from '@/lib/admin-auth';
import { ADMIN_ROLES, SENSITIVE_ROLES, isAdminRole, canActOnTarget, type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.roles.read' as Permission });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const assignments = await prisma.adminRoleAssignment.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ assignments });
  } catch (err) {
    console.error('GET /admin/assignments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.roles.assign' as Permission, sensitive: true });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { userId, role, grantedById } = await request.json();
    if (!userId || !role || !isAdminRole(role)) {
      return NextResponse.json({ error: 'Valid userId and role are required.' }, { status: 400 });
    }

    // Prevent disabling the last GLOBAL_ADMIN.
    if (role === 'GLOBAL_ADMIN') {
      const count = await prisma.adminRoleAssignment.count({ where: { role: 'GLOBAL_ADMIN' } });
      if (count === 0) {
        return NextResponse.json({ error: 'Cannot remove the last GLOBAL_ADMIN assignment.' }, { status: 403 });
      }
    }

    // Containment: non-GLOBAL_ADMIN cannot assign sensitive roles to a GLOBAL_ADMIN target.
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const targetAssignments = await prisma.adminRoleAssignment.findMany({ where: { userId }, select: { role: true } });
    const targetRoles = targetAssignments.map((a: any) => a.role);
    if (!canActOnTarget(actor.roles, targetRoles)) {
      return NextResponse.json({ error: 'Cannot modify a GLOBAL_ADMIN assignment.' }, { status: 403 });
    }

    const assignment = await prisma.adminRoleAssignment.create({
      data: { userId, role, grantedById: actor.userId },
    });

    await auditLog({
      actorId: actor.userId,
      actorLabel: actor.email,
      category: 'ADMIN_ACTION',
      action: 'role.assign',
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'user',
      targetId: String(userId),
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined,
      metadata: { role, targetUserId: userId },
    });

    return NextResponse.json({ assignment, message: `Role ${role} assigned.` });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'User already has this role assigned.' }, { status: 400 });
    }
    console.error('POST /admin/assignments error:', err);
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

    const targetAssignments = await prisma.adminRoleAssignment.findMany({ where: { userId }, select: { role: true } });
    const targetRoles = targetAssignments.map((a: any) => a.role);
    if (!canActOnTarget(actor.roles, targetRoles)) {
      return NextResponse.json({ error: 'Cannot modify a GLOBAL_ADMIN assignment.' }, { status: 403 });
    }

    await prisma.adminRoleAssignment.delete({ where: { userId_role: { userId, role } } });

    await auditLog({
      actorId: actor.userId,
      actorLabel: actor.email,
      category: 'ADMIN_ACTION',
      action: 'role.revoke',
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'user',
      targetId: String(userId),
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined,
      metadata: { role, targetUserId: userId },
    });

    return NextResponse.json({ message: `Role ${role} revoked.` });
  } catch (err) {
    console.error('DELETE /admin/assignments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
