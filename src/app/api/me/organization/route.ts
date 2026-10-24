import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyAccessToken(token) as any;
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  if (decoded.role !== 'ORGANIZATION') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: decoded.id },
    include: { organization: true },
  });
  if (!membership) return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  return NextResponse.json(membership.organization);
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyAccessToken(token) as any;
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  if (decoded.role !== 'ORGANIZATION') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: decoded.id },
  });
  if (!membership) return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name } = body;
  if (!name || name.trim().length < 2) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });

  const org = await prisma.organization.update({
    where: { id: membership.organizationId },
    data: { name: name.trim() },
  });
  return NextResponse.json(org);
}
