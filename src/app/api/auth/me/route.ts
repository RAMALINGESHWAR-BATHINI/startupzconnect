import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { permissionsFor } from '@/lib/permissions';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, name: true, email: true, role: true, status: true,
        investorVerificationStatus: true, emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Load admin roles + permissions (navigation only — backend is the authority).
    const assignments = await prisma.adminRoleAssignment.findMany({
      where: { userId: user.id },
      select: { role: true },
    });
    const adminRoles = assignments.map((a: any) => a.role);
    const permissions = permissionsFor(adminRoles);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        investorVerificationStatus: user.investorVerificationStatus,
        emailVerified: user.emailVerified,
        adminRoles,
        permissions: Array.from(permissions),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }
}
