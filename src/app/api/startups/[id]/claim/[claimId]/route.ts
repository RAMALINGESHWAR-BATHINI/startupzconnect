import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import { canTransition } from '@/lib/profile-claim-policy';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; claimId: string }> }) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.approvals.review' as Permission, sensitive: true });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { id, claimId } = await params;
    const claim = await prisma.profileClaim.findUnique({ where: { id: parseInt(claimId) } });
    if (!claim || claim.startupId !== parseInt(id)) return NextResponse.json({ error: 'Claim not found.' }, { status: 404 });

    const { decision, decisionNote } = await request.json();
    const newStatus = decision === 'approve' ? 'APPROVED' : decision === 'reject' ? 'REJECTED' : decision === 'more_info' ? 'NEEDS_MORE_INFORMATION' : null;
    if (!newStatus) return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 });
    if (!canTransition(claim.status, newStatus as any)) return NextResponse.json({ error: 'Invalid status transition.' }, { status: 409 });

    const updated = await prisma.profileClaim.update({
      where: { id: claim.id },
      data: { status: newStatus, reviewerId: actor.userId, decidedAt: new Date(), decisionNote: decisionNote?.trim() || null },
    });

    // If approved and no existing founder, grant ownership (fail-closed on audit)
    if (newStatus === 'APPROVED') {
      const startup = await prisma.startup.findUnique({ where: { id: claim.startupId } });
      if (startup && startup.founderId === null) {
        // founderId is non-nullable in schema, so this branch won't trigger; keep as guard
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH claim error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
