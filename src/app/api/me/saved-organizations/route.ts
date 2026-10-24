import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const saved = await prisma.savedOrganization.findMany({
      where: { userId: decoded.id },
      include: { organization: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(saved);
  } catch (err) {
    console.error('GET saved orgs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const organizationId = parseInt(body?.organizationId);
    if (!organizationId || isNaN(organizationId)) {
      return NextResponse.json({ error: 'organizationId is required.' }, { status: 400 });
    }
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });

    const saved = await prisma.savedOrganization.upsert({
      where: { userId_organizationId: { userId: decoded.id, organizationId } },
      create: { userId: decoded.id, organizationId },
      update: {},
      include: { organization: { select: { id: true, name: true, slug: true } } },
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    console.error('POST saved org error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const organizationId = parseInt(url.searchParams.get('organizationId') || '');
    if (!organizationId || isNaN(organizationId)) {
      return NextResponse.json({ error: 'organizationId is required.' }, { status: 400 });
    }
    await prisma.savedOrganization.deleteMany({ where: { userId: decoded.id, organizationId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE saved org error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
