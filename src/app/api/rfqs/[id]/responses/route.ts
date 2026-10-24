import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { hasOrgMembership } from '@/lib/admin-auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);
    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isBuyer = await hasOrgMembership(decoded.id, rfq.buyerOrganizationId, 'MEMBER');
    if (isBuyer) {
      const responses = await prisma.rfqResponse.findMany({ where: { rfqId }, orderBy: { createdAt: 'desc' } });
      return NextResponse.json(responses);
    }
    // vendor: only own response
    const memberships = await prisma.organizationMembership.findMany({ where: { userId: decoded.id }, select: { organizationId: true } });
    const orgIds = memberships.map((m) => m.organizationId);
    const responses = await prisma.rfqResponse.findMany({ where: { rfqId, vendorOrganizationId: { in: orgIds } } });
    return NextResponse.json(responses);
  } catch (err) {
    console.error('GET responses error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    if (rfq.status !== 'OPEN') return NextResponse.json({ error: 'RFQ is not open for responses.' }, { status: 409 });

    const body = await request.json();
    const { vendorOrganizationId, message, priceQuote } = body || {};
    if (!vendorOrganizationId || !message) {
      return NextResponse.json({ error: 'vendorOrganizationId and message are required.' }, { status: 400 });
    }
    const vendorOrgId = parseInt(vendorOrganizationId);
    if (vendorOrgId === rfq.buyerOrganizationId) {
      return NextResponse.json({ error: 'Buyer organization cannot respond to its own RFQ.' }, { status: 400 });
    }
    if (!(await hasOrgMembership(decoded.id, vendorOrgId, 'ADMIN'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.rfqResponse.findUnique({ where: { rfqId_vendorOrganizationId: { rfqId, vendorOrganizationId: vendorOrgId } } });
    if (existing) return NextResponse.json({ error: 'You have already responded to this RFQ.' }, { status: 409 });

    const response = await prisma.rfqResponse.create({
      data: {
        rfqId,
        vendorOrganizationId: vendorOrgId,
        message: String(message).trim(),
        priceQuote: priceQuote || null,
        status: 'SUBMITTED',
      },
    });
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error('POST response error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
