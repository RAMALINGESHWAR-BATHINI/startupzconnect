import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { ADMIN_ROLES, OPERATIONAL_ROLES, ROLE_DESCRIPTIONS, ROLE_PERMISSIONS, SENSITIVE_ROLES, isAdminRole, type Permission } from '@/lib/permissions';
import { auditLog } from '@/lib/admin-auth';
import { isPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.roles.read' as Permission });
    if (auth instanceof NextResponse) return auth;

    const assignments = await prisma.adminRoleAssignment.findMany({
      select: { role: true },
      distinct: ['role'],
    });
    const roles = new Set(assignments.map((a: any) => a.role));

    return NextResponse.json({
      roles: ADMIN_ROLES.map((r) => ({ id: r, name: r, description: ROLE_DESCRIPTIONS[r], active: roles.has(r), sensitive: SENSITIVE_ROLES.includes(r) })),
      operationalRoles: OPERATIONAL_ROLES.map((r) => ({ id: r, name: r, description: ROLE_DESCRIPTIONS[r] })),
      permissions: (Object.keys(ROLE_PERMISSIONS) as string[]).flatMap((r) => ROLE_PERMISSIONS[r as keyof typeof ROLE_PERMISSIONS].map((p) => ({ permission: p, role: r }))),
    });
  } catch (err) {
    console.error('GET /admin/roles error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.roles.assign' as Permission, sensitive: true });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { role, permissions } = await request.json();
    if (!role || !isAdminRole(role)) return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    if (SENSITIVE_ROLES.includes(role) && !actor.roles.includes('GLOBAL_ADMIN')) {
      return NextResponse.json({ error: 'Only GLOBAL_ADMIN can create sensitive roles.' }, { status: 403 });
    }

    const permList = Array.isArray(permissions) ? permissions : [];
    for (const p of permList) {
      if (!isPermission(p)) return NextResponse.json({ error: `Invalid permission: ${p}` }, { status: 400 });
    }

    await auditLog({
      actorId: actor.userId,
      actorLabel: actor.email,
      category: 'ADMIN_ACTION',
      action: 'role.create',
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'role',
      targetId: role,
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined,
      metadata: { role, permissions: permList, createdBy: actor.userId },
    });

    return NextResponse.json({ message: `Role ${role} registered.`, role, permissions: permList });
  } catch (err) {
    console.error('POST /admin/roles error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
