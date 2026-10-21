import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { authorizeAdmin, auditLog } from '@/lib/admin-auth';
import { investorDecisionTarget } from '@/lib/transitions';
import { type Permission } from '@/lib/permissions';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  return verifyAccessToken(token) as any;
}

// User submits their investor profile for verification.
export async function POST(request: Request) {
  try {
    const decoded = await getUser();
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { investorNetWorth, investorTicketSize, investorThesis, investorSectors, investorPastDeals, sebiRegNumber } = await request.json();

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const currentStatus = user.investorVerificationStatus || 'NONE';
    let newStatus = currentStatus;
    if (currentStatus === 'VERIFIED') {
      newStatus = 'PENDING'; // material change requires re-review
    } else if (currentStatus === 'NONE' || currentStatus === 'REJECTED') {
      newStatus = 'PENDING';
    }
    if (currentStatus === 'REVOKED') {
      return NextResponse.json({ error: 'Your verification was revoked. Contact support to reopen.' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: decoded.id },
      data: {
        investorNetWorth,
        investorTicketSize: investorTicketSize || null,
        investorThesis: investorThesis || null,
        investorSectors: investorSectors || null,
        investorPastDeals: investorPastDeals || null,
        sebiRegNumber: sebiRegNumber || null,
        investorVerificationStatus: newStatus,
        investorReviewedBy: null,
        investorReviewedAt: null,
        investorReviewNotes: null,
      },
    });

    await auditLog({
      actorId: decoded.id,
      actorLabel: user.email,
      category: 'ADMIN_ACTION',
      action: 'investor.verification.request',
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'user',
      targetId: String(decoded.id),
      ip: request.headers.get('x-forwarded-for') ?? request.headers.get('cf-connecting-ip') ?? undefined,
      metadata: { previousStatus: currentStatus, newStatus },
    });

    return NextResponse.json({ message: 'Verification request submitted. Your status is now PENDING.', status: newStatus });
  } catch (err) {
    console.error('POST /auth/investor-verification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin reviews an investor verification (VERIFY / REJECT / REVOKE / REOPEN).
export async function PATCH(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'investors.verification.review' as Permission, sensitive: true });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { userId, decision, decisionNote } = await request.json();
    if (!userId || !decision) return NextResponse.json({ error: 'userId and decision are required.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const currentStatus = user.investorVerificationStatus || 'NONE';
    const newStatus = investorDecisionTarget(decision, currentStatus);
    if (!newStatus) {
      return NextResponse.json({ error: `Cannot ${decision} an investor with status ${currentStatus}.` }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { investorVerificationStatus: newStatus, investorReviewedBy: actor.userId, investorReviewedAt: new Date(), investorReviewNotes: decisionNote || null },
    });

    await auditLog({
      actorId: actor.userId,
      actorLabel: actor.email,
      category: 'ADMIN_ACTION',
      action: `investor.verification.${decision.toLowerCase()}`,
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'user',
      targetId: String(userId),
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined,
      metadata: { decision, previousStatus: currentStatus, newStatus, decisionNote },
    });

    return NextResponse.json({ message: `Investor verification ${decision}d.`, status: newStatus });
  } catch (err) {
    console.error('PATCH /auth/investor-verification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
