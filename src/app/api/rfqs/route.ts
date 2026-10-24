import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { hasOrgMembership } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const rfqs = await prisma.rfq.findMany({
      where: { ...(status ? { status } : {}), ...(category ? { category } : {}) },
      include: { buyerOrganization: { select: { id: true, name: true } }, _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(rfqs);
  } catch (err) {
    console.error('GET rfqs error:', err);
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
    const { buyerOrganizationId, title, description, category, budgetRange, deadline, status } = body || {};
    if (!buyerOrganizationId || !title || !description || !category) {
      return NextResponse.json({ error: 'buyerOrganizationId, title, description, and category are required.' }, { status: 400 });
    }
    const orgId = parseInt(buyerOrganizationId);
    if (!(await hasOrgMembership(decoded.id, orgId, 'ADMIN'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rfq = await prisma.rfq.create({
      data: {
        buyerOrganizationId: orgId,
        title: String(title).trim(),
        description: String(description).trim(),
        category: String(category).trim(),
        budgetRange: budgetRange || null,
        deadline: deadline ? new Date(deadline) : null,
        status: status || 'DRAFT',
      },
    });
    return NextResponse.json(rfq, { status: 201 });
  } catch (err) {
    console.error('POST rfq error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
