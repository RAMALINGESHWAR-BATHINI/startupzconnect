import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth'
import { hasLiveAdminRole } from '@/lib/admin-auth';
import { cookies } from 'next/headers';
import { isSafeHttpUrl } from '@/lib/url-safety';

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
    if (startup.founderId !== decoded.id && !(await hasLiveAdminRole(decoded.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, role, linkedin, photoUrl, isFounder } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

    if (linkedin && !isSafeHttpUrl(linkedin)) {
      return NextResponse.json({ error: 'LinkedIn must be a valid http(s) link.' }, { status: 400 });
    }

    const member = await prisma.teamMember.create({
      data: {
        startupId: parseInt(id),
        name: name.trim(),
        role: role?.trim() || null,
        linkedin: linkedin || null,
        photoUrl: photoUrl?.trim() || null,
        isFounder: !!isFounder,
      },
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
    if (!startup || (startup.founderId !== decoded.id && !(await hasLiveAdminRole(decoded.id)))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { memberId } = await request.json();
    if (!memberId) return NextResponse.json({ error: 'memberId is required.' }, { status: 400 });

    // IDOR fix: verify the member actually belongs to this startup before deleting.
    const member = await prisma.teamMember.findUnique({ where: { id: parseInt(memberId) } });
    if (!member) return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    if (member.startupId !== startup.id) {
      return NextResponse.json({ error: 'Forbidden: member does not belong to this startup.' }, { status: 403 });
    }

    await prisma.teamMember.delete({ where: { id: parseInt(memberId) } });
    return NextResponse.json({ message: 'Team member removed.' });
  } catch (err) {
    console.error('DELETE /team error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



