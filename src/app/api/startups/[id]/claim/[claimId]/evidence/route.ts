import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { uploadFile, getSignedUrl } from '@/lib/storage';
import { verifyFileSignature, declaredMimeAllowed } from '@/lib/file-signature';

const ALLOWED = ['application/pdf','image/png','image/jpeg'];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ id: string; claimId: string }> }) {
  try {
    const { id, claimId } = await params;
    const startupId = parseInt(id);
    const cid = parseInt(claimId);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const claim = await prisma.profileClaim.findUnique({ where: { id: cid } });
    if (!claim || claim.startupId !== startupId) return NextResponse.json({ error: 'Claim not found.' }, { status: 404 });
    if (claim.claimantUserId !== decoded.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'File required.' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 5MB).' }, { status: 413 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'File type not allowed.' }, { status: 415 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const sig = verifyFileSignature(buffer, file.name, file.type);
    if (!sig.ok) return NextResponse.json({ error: sig.error || 'Invalid file signature.' }, { status: 400 });

    const { key } = await uploadFile(buffer, file.type, file.name, 'claims');
    const ev = await prisma.claimEvidence.create({
      data: { claimId: cid, storageKey: key, fileName: file.name, mimeType: file.type, sizeBytes: file.size },
    });
    return NextResponse.json(ev, { status: 201 });
  } catch (err) {
    console.error('POST evidence error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string; claimId: string }> }) {
  try {
    const { id, claimId } = await params;
    const startupId = parseInt(id);
    const cid = parseInt(claimId);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const claim = await prisma.profileClaim.findUnique({ where: { id: cid } });
    if (!claim || claim.startupId !== startupId) return NextResponse.json({ error: 'Claim not found.' }, { status: 404 });

    // allow claimant or live admin
    const isAdmin = await (await import('@/lib/admin-auth')).hasLiveAdminRole(decoded.id);
    if (claim.claimantUserId !== decoded.id && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const evidences = await prisma.claimEvidence.findMany({ where: { claimId: cid } });
    const withUrls = await Promise.all(evidences.map(async (e) => ({ ...e, url: await getSignedUrl(e.storageKey) })));
    return NextResponse.json(withUrls);
  } catch (err) {
    console.error('GET evidence error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
