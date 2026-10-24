import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'institutions.manage' as Permission });
    if (auth instanceof NextResponse) return auth;

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
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'institutions.manage' as Permission });
    if (auth instanceof NextResponse) return auth;

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
