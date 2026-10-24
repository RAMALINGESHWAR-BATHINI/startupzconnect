import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { hasOrgMembership } from '@/lib/admin-auth';
import { uploadFile, getSignedUrl } from '@/lib/storage';
import { verifyFileSignature } from '@/lib/file-signature';

const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ id: string; responseId: string }> }) {
  try {
    const { id, responseId } = await params;
    const rfqId = parseInt(id);
    const rid = parseInt(responseId);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const response = await prisma.rfqResponse.findUnique({ where: { id: rid } });
    if (!response || response.rfqId !== rfqId) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    if (!(await hasOrgMembership(decoded.id, response.vendorOrganizationId, 'ADMIN'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'File required.' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 5MB).' }, { status: 413 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'File type not allowed.' }, { status: 415 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const sig = verifyFileSignature(buffer, file.name, file.type);
    if (!sig.ok) return NextResponse.json({ error: sig.error || 'Invalid file signature.' }, { status: 400 });

    const { key } = await uploadFile(buffer, file.type, file.name, 'claims');

    const existing = response.attachments ? JSON.parse(response.attachments) : [];
    const updated = [...existing, key];
    await prisma.rfqResponse.update({ where: { id: rid }, data: { attachments: JSON.stringify(updated) } });

    return NextResponse.json({ key }, { status: 201 });
  } catch (err) {
    console.error('POST attachment error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string; responseId: string }> }) {
  try {
    const { id, responseId } = await params;
    const rfqId = parseInt(id);
    const rid = parseInt(responseId);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const response = await prisma.rfqResponse.findUnique({ where: { id: rid } });
    if (!response || response.rfqId !== rfqId) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const isBuyer = await hasOrgMembership(decoded.id, rfq.buyerOrganizationId, 'MEMBER');
    const isVendor = await hasOrgMembership(decoded.id, response.vendorOrganizationId, 'MEMBER');
    if (!isBuyer && !isVendor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const keys: string[] = response.attachments ? JSON.parse(response.attachments) : [];
    const urls = await Promise.all(keys.map(async (k) => ({ key: k, url: await getSignedUrl(k, 300) })));
    return NextResponse.json(urls);
  } catch (err) {
    console.error('GET attachments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
