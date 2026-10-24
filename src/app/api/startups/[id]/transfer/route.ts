import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { hasOrgMembership } from '@/lib/admin-auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const startupId = parseInt(id);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const startup = await prisma.startup.findUnique({ where: { id: startupId } });
    if (!startup) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id) return NextResponse.json({ error: 'Only the founder can request transfer.' }, { status: 403 });

    const body = await request.json();
    const toUserId = parseInt(body?.toUserId);
    if (!toUserId || isNaN(toUserId)) return NextResponse.json({ error: 'toUserId is required.' }, { status: 400 });
    if (toUserId === decoded.id) return NextResponse.json({ error: 'Cannot transfer to self.' }, { status: 400 });

    const newOwner = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!newOwner) return NextResponse.json({ error: 'New owner not found.' }, { status: 404 });

    // Prevent duplicate pending requests
    const existing = await prisma.approvalRequest.findFirst({
      where: { type: 'OWNERSHIP_TRANSFER', status: 'PENDING' },
    });
    // Simple check: look for payload containing startupId
    const pending = await prisma.approvalRequest.findMany({ where: { type: 'OWNERSHIP_TRANSFER', status: 'PENDING' } });
    for (const p of pending) {
      try {
        const pl = JSON.parse(p.payload);
        if (pl.startupId === startupId) return NextResponse.json({ error: 'A transfer request is already pending for this startup.' }, { status: 409 });
      } catch {}
    }

    const approval = await prisma.approvalRequest.create({
      data: {
        type: 'OWNERSHIP_TRANSFER',
        status: 'PENDING',
        requestedById: decoded.id,
        reason: `Transfer ownership of startup ${startupId} to user ${toUserId}`,
        payload: JSON.stringify({ startupId, fromUserId: decoded.id, toUserId }),
        expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
      },
    });
    return NextResponse.json(approval, { status: 201 });
  } catch (err) {
    console.error('POST transfer error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
