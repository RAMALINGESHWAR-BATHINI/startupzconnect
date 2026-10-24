import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { hasOrgMembership } from '@/lib/admin-auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);
    const rfq = await prisma.rfq.findUnique({
      where: { id: rfqId },
      include: {
        buyerOrganization: { select: { id: true, name: true } },
        responses: { select: { id: true, vendorOrganizationId: true, status: true, createdAt: true } },
      },
    });
    if (!rfq) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    const decoded = token ? (verifyAccessToken(token) as any) : null;
    const isBuyer = decoded ? await hasOrgMembership(decoded.id, rfq.buyerOrganizationId, 'MEMBER') : false;

    // Only buyer org members see full response list; others see count only.
    if (!isBuyer) {
      const { responses, ...rest } = rfq as any;
      return NextResponse.json({ ...rest, responseCount: responses.length });
    }
    return NextResponse.json(rfq);
  } catch (err) {
    console.error('GET rfq detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (!(await hasOrgMembership(decoded.id, rfq.buyerOrganizationId, 'ADMIN'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, budgetRange, deadline, status } = body || {};
    const updated = await prisma.rfq.update({
      where: { id: rfqId },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(description !== undefined ? { description: String(description).trim() } : {}),
        ...(category !== undefined ? { category: String(category).trim() } : {}),
        ...(budgetRange !== undefined ? { budgetRange: budgetRange || null } : {}),
        ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH rfq error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

