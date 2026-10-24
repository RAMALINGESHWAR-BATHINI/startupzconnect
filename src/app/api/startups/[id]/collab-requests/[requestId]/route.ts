import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth'
import { hasLiveAdminRole } from '@/lib/admin-auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  try {
    const { id, requestId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(id) } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id && !(await hasLiveAdminRole(decoded.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status } = await request.json();
    if (!['ACCEPTED', 'REJECTED'].includes(status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });

    const reqRow = await prisma.collaborationRequest.findUnique({ where: { id: parseInt(requestId) } });
    if (!reqRow || reqRow.startupId !== startup.id) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

    const updated = await prisma.collaborationRequest.update({ where: { id: reqRow.id }, data: { status } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /collab-requests/[requestId] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



