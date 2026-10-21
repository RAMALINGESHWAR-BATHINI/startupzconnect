import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { auditLog } from '@/lib/admin-auth';
import { permissionsFor, hasPermission, type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.roles.read' as Permission });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId query parameter is required.' }, { status: 400 });
    }

    const assignments = await prisma.adminRoleAssignment.findMany({
      where: { userId: parseInt(targetUserId) },
      select: { role: true },
    });
    const roles = assignments.map((a: any) => a.role);
    const permissions = permissionsFor(roles);

    return NextResponse.json({
      userId: parseInt(targetUserId),
      roles,
      permissions: Array.from(permissions),
    });
  } catch (err) {
    console.error('GET /admin/permissions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.roles.assign' as Permission, sensitive: true });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { userId, permission } = await request.json();
    if (!userId || !permission) {
      return NextResponse.json({ error: 'userId and permission are required.' }, { status: 400 });
    }

    // Permissions are derived from roles, not assigned individually.
    // To grant a permission, assign a role that carries it.
    return NextResponse.json({
      error: 'Permissions are role-derived. Use /admin/grants to assign a role that includes this permission.',
    }, { status: 400 });
  } catch (err) {
    console.error('POST /admin/permissions error:', err);
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
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required.' }, { status: 400 });
    }

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
      action: 'permission.revoke',
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'user',
      targetId: String(userId),
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined,
      metadata: { role, targetUserId: userId },
    });

    return NextResponse.json({ message: `Role ${role} revoked.` });
  } catch (err) {
    console.error('DELETE /admin/permissions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
