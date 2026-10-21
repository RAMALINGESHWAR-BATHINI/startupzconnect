import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { auditLog } from '@/lib/admin-auth';
import { ADMIN_ROLES, isAdminRole, ROLE_DESCRIPTIONS, permissionsFor, hasPermission, type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.users.read' as Permission });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, status: true, investorVerificationStatus: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Attach admin assignments for each user.
    const userIds = users.map((u: any) => u.id);
    const assignments = await prisma.adminRoleAssignment.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, role: true },
    });
    const assignmentMap = new Map<number, string[]>();
    for (const a of assignments) {
      const list = assignmentMap.get(a.userId) ?? [];
      list.push(a.role);
      assignmentMap.set(a.userId, list);
    }

    return NextResponse.json({
      users: users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        investorVerificationStatus: u.investorVerificationStatus,
        adminRoles: assignmentMap.get(u.id) ?? [],
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error('GET /admin/users error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
