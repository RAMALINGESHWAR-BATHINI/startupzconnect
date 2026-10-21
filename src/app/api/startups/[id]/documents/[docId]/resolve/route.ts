import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { getSignedUrl } from '@/lib/storage';
import { authorizeAdmin, auditLog } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  try {
    const { id, docId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const doc = await prisma.startupDocument.findUnique({ where: { id: parseInt(docId) } });
    if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    if (doc.startupId !== parseInt(id)) return NextResponse.json({ error: 'Document does not belong to this startup.' }, { status: 404 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(id) } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });

    const ip = _req.headers.get('x-forwarded-for') ?? _req.headers.get('cf-connecting-ip') ?? undefined;

    // Authorization: founder, or admin with documents.verify / inspections.reports.read, or verified investor with interest.
    const isFounder = startup.founderId === decoded.id;
    let isAdmin = false;
    if (!isFounder) {
      const auth = await authorizeAdmin(_req as any, { permission: 'documents.verify' as Permission });
      if (!(auth instanceof NextResponse)) isAdmin = true;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { investorVerificationStatus: true, email: true } });
    const isVerifiedInvestor = user?.investorVerificationStatus === 'VERIFIED';
    const investorInterest = isVerifiedInvestor
      ? await prisma.investmentInterest.findUnique({ where: { startupId_userId: { startupId: parseInt(id), userId: decoded.id } } })
      : null;

    if (!isFounder && !isAdmin && !(isVerifiedInvestor && !!investorInterest)) {
      await auditLog({
        actorId: decoded.id,
        category: 'AUTHZ_FAILURE',
        action: 'document.resolve.denied',
        severity: 'WARN',
        outcome: 'DENIED',
        targetType: 'startupDocument',
        targetId: docId,
        ip,
        metadata: { docType: doc.docType, startupId: doc.startupId },
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate short-lived signed URL (5 minutes).
    const signedUrl = await getSignedUrl(doc.fileUrl, 300);

    await auditLog({
      actorId: decoded.id,
      actorLabel: user?.email,
      category: 'ADMIN_ACTION',
      action: 'document.resolve',
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'startupDocument',
      targetId: docId,
      ip,
      metadata: { docType: doc.docType, startupId: doc.startupId },
    });

    return NextResponse.json({ signedUrl, expiresIn: 300, docType: doc.docType });
  } catch (err) {
    console.error('GET /documents/resolve error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
