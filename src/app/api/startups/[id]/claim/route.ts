import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { isActiveClaim } from '@/lib/profile-claim-policy';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const startupId = parseInt(id);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reason, evidenceNote } = await request.json();
    if (!reason || reason.trim().length < 10) return NextResponse.json({ error: 'Reason must be at least 10 characters.' }, { status: 400 });

    // Prevent duplicate active claims
    const existing = await prisma.profileClaim.findFirst({
      where: { startupId, claimantUserId: decoded.id, status: { in: ['PENDING','UNDER_REVIEW','NEEDS_MORE_INFORMATION'] } },
    });
    if (existing) return NextResponse.json({ error: 'You already have an active claim for this profile.' }, { status: 409 });

    const claim = await prisma.profileClaim.create({
      data: { startupId, claimantUserId: decoded.id, reason: reason.trim(), evidenceNote: evidenceNote?.trim() || null, status: 'PENDING' },
    });
    return NextResponse.json(claim, { status: 201 });
  } catch (err) {
    console.error('POST claim error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const startupId = parseInt(id);
    const claims = await prisma.profileClaim.findMany({ where: { startupId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(claims);
  } catch (err) {
    console.error('GET claims error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
