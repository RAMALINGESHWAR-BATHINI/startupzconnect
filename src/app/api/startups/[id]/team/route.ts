import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(id) } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, role, linkedin, photoUrl, isFounder } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

    const member = await prisma.teamMember.create({
      data: { startupId: parseInt(id), name: name.trim(), role: role?.trim() || null, linkedin: linkedin || null, photoUrl: photoUrl?.trim() || null, isFounder: !!isFounder },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    console.error('POST /team error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(id) } });
    if (!startup || (startup.founderId !== decoded.id && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { memberId } = await request.json();
    await prisma.teamMember.delete({ where: { id: memberId } });
    return NextResponse.json({ message: 'Team member removed.' });
  } catch (err) {
    console.error('DELETE /team error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
