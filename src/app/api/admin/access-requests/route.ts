import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { auditLog } from '@/lib/admin-auth';
import { APPROVAL_TYPES, canDecide, isApprovalType } from '@/lib/approval-policy';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.approvals.read' as Permission });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const requests = await prisma.approvalRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ requests });
  } catch (err) {
    console.error('GET /admin/access-requests error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.roles.assign' as Permission });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { type, reason, durationHours } = await request.json();
    if (!isApprovalType(type)) return NextResponse.json({ error: 'Invalid approval type.' }, { status: 400 });

    const config = APPROVAL_TYPES[type];
    if (!actor.permissions.has(config.requestPermission)) {
      return NextResponse.json({ error: 'You may not request this type of access.' }, { status: 403 });
    }

    const ttlHours = durationHours ?? config.ttlHours;
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    const reqRecord = await prisma.approvalRequest.create({
      data: {
        type,
        status: 'PENDING',
        requestedById: actor.userId,
        reason,
        payload: JSON.stringify({ type, requestedById: actor.userId }),
        expiresAt,
      },
    });

    await auditLog({
      actorId: actor.userId,
      actorLabel: actor.email,
      category: 'APPROVAL',
      action: 'request.create',
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'approval',
      targetId: String(reqRecord.id),
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined,
      metadata: { type, reason, expiresAt },
    });

    return NextResponse.json({ request: reqRecord, message: 'Access request submitted.' });
  } catch (err) {
    console.error('POST /admin/access-requests error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
