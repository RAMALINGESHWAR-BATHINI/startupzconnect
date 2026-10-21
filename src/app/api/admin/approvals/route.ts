import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { auditLog } from '@/lib/admin-auth';
import { canDecide, APPROVAL_TYPES } from '@/lib/approval-policy';
import { type Permission } from '@/lib/permissions';
import { sendMail } from '@/lib/mailer';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.approvals.review' as Permission, sensitive: true });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { requestId, decision, decisionNote } = await request.json();
    if (!requestId || !decision) {
      return NextResponse.json({ error: 'requestId and decision are required.' }, { status: 400 });
    }

    const reqRecord = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!reqRecord) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

    const verdict = canDecide(reqRecord as any, { id: actor.userId, permissions: actor.permissions });
    if (!verdict.ok) {
      return NextResponse.json({ error: verdict.reason }, { status: verdict.status });
    }

    const newStatus = decision === 'approve' ? 'APPROVED' : decision === 'reject' ? 'REJECTED' : null;
    if (!newStatus) return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 });

    const updated = await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: newStatus, decidedById: actor.userId, decidedAt: new Date(), decisionNote },
    });

    // Mandatory: notify GLOBAL_ADMIN of any delegated approval.
    if (newStatus === 'APPROVED' && !actor.roles.includes('GLOBAL_ADMIN')) {
      const globalAdmins = await prisma.adminRoleAssignment.findMany({
        where: { role: 'GLOBAL_ADMIN' },
        include: { user: { select: { id: true, email: true } } },
      });
      for (const ga of globalAdmins) {
        if (ga.userId === actor.userId) continue;
        await prisma.notification.create({
          data: {
            userId: ga.userId,
            title: 'Delegated approval requires tracking',
            message: `${actor.email} approved a ${reqRecord.type} request (id ${requestId}).`,
            link: `/admin/approvals`,
          },
        });
        await sendMail(
          ga.user.email,
          'Delegated admin approval - GLOBAL_ADMIN tracking',
          `Admin ${actor.email} approved a ${reqRecord.type} request (id ${requestId}) for user ${reqRecord.requestedById}. Review in the admin dashboard.`
        );
      }
    }

    await auditLog({
      actorId: actor.userId,
      actorLabel: actor.email,
      category: 'APPROVAL',
      action: `request.${decision}`,
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'approval',
      targetId: String(requestId),
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined,
      metadata: { type: reqRecord.type, decision, decisionNote, requesterId: reqRecord.requestedById },
    });

    return NextResponse.json({ request: updated, message: `Request ${decision}d.` });
  } catch (err) {
    console.error('POST /admin/approvals error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
