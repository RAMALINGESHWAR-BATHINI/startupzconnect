import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { hasOrgMembership } from '@/lib/admin-auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orgId = parseInt(id);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const offerings = await prisma.vendorOffering.findMany({
      where: { organizationId: orgId, ...(status ? { status } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(offerings);
  } catch (err) {
    console.error('GET offerings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orgId = parseInt(id);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allowed = await hasOrgMembership(decoded.id, orgId, 'ADMIN');
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { title, description, category, capabilities, pricingModel, deployment, certifications, status } = body || {};
    if (!title || !description || !category) {
      return NextResponse.json({ error: 'title, description, and category are required.' }, { status: 400 });
    }

    const offering = await prisma.vendorOffering.create({
      data: {
        organizationId: orgId,
        title: String(title).trim(),
        description: String(description).trim(),
        category: String(category).trim(),
        capabilities: capabilities ? JSON.stringify(capabilities) : null,
        pricingModel: pricingModel || null,
        deployment: deployment || null,
        certifications: certifications ? JSON.stringify(certifications) : null,
        status: status || 'DRAFT',
      },
    });
    return NextResponse.json(offering, { status: 201 });
  } catch (err) {
    console.error('POST offerings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
