import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded || decoded.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const partners = await prisma.institutionPartner.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { startups: true } } },
    });
    return NextResponse.json(partners);
  } catch (err) {
    console.error('GET /admin/institutions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded || decoded.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { name, contactName, contactEmail, city } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Institution name is required.' }, { status: 400 });

    const partner = await prisma.institutionPartner.create({
      data: { name: name.trim(), contactName: contactName?.trim() || null, contactEmail: contactEmail?.trim() || null, city: city?.trim() || null },
    });
    return NextResponse.json(partner, { status: 201 });
  } catch (err) {
    console.error('POST /admin/institutions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
