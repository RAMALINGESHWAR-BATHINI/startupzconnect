import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { hasOrgMembership } from '@/lib/admin-auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; offeringId: string }> }) {
  try {
    const { id, offeringId } = await params;
    const orgId = parseInt(id);
    const oid = parseInt(offeringId);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await hasOrgMembership(decoded.id, orgId, 'ADMIN'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const existing = await prisma.vendorOffering.findUnique({ where: { id: oid } });
    if (!existing || existing.organizationId !== orgId) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const body = await request.json();
    const { title, description, category, capabilities, pricingModel, deployment, certifications, status } = body || {};
    const updated = await prisma.vendorOffering.update({
      where: { id: oid },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(description !== undefined ? { description: String(description).trim() } : {}),
        ...(category !== undefined ? { category: String(category).trim() } : {}),
        ...(capabilities !== undefined ? { capabilities: capabilities ? JSON.stringify(capabilities) : null } : {}),
        ...(pricingModel !== undefined ? { pricingModel: pricingModel || null } : {}),
        ...(deployment !== undefined ? { deployment: deployment || null } : {}),
        ...(certifications !== undefined ? { certifications: certifications ? JSON.stringify(certifications) : null } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH offering error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; offeringId: string }> }) {
  try {
    const { id, offeringId } = await params;
    const orgId = parseInt(id);
    const oid = parseInt(offeringId);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await hasOrgMembership(decoded.id, orgId, 'ADMIN'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const existing = await prisma.vendorOffering.findUnique({ where: { id: oid } });
    if (!existing || existing.organizationId !== orgId) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    await prisma.vendorOffering.delete({ where: { id: oid } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE offering error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
