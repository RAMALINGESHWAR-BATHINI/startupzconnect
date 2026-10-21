import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

async function getDecoded() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  return verifyAccessToken(token) as any;
}

export async function GET() {
  const decoded = await getDecoded();
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const decoded = await getDecoded();
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name } = await request.json();
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
    }
    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be under 100 characters.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: decoded.id },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('PUT /auth/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
