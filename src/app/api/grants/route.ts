import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function GET() {
  try {
    const grants = await prisma.grant.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(grants);
  } catch (err) {
    console.error('GET /grants error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'grants.manage' as Permission });
    if (auth instanceof NextResponse) return auth;

    const { name, provider, description, eligibility, amountRange, applyUrl, deadline } = await request.json();
    if (!name?.trim() || !provider?.trim() || !description?.trim() || !eligibility?.trim()) {
      return NextResponse.json({ error: 'Name, provider, description, and eligibility are required.' }, { status: 400 });
    }

    const grant = await prisma.grant.create({
      data: { name: name.trim(), provider: provider.trim(), description: description.trim(), eligibility: eligibility.trim(),
        amountRange: amountRange?.trim() || null, applyUrl: applyUrl?.trim() || null, deadline: deadline ? new Date(deadline) : null },
    });
    return NextResponse.json(grant, { status: 201 });
  } catch (err) {
    console.error('POST /grants error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
