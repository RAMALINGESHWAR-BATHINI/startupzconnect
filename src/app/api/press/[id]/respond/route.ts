import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { notifyUser } from '@/lib/notify';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { startupId, message } = await request.json();
    if (!startupId || !message?.trim()) return NextResponse.json({ error: 'startupId and message are required.' }, { status: 400 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(startupId) } });
    if (!startup || (startup.founderId !== decoded.id && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'You can only respond on behalf of your own startup.' }, { status: 403 });
    }

    const existing = await prisma.pressResponse.findFirst({ where: { pressRequestId: parseInt(id), startupId: startup.id } });
    if (existing) return NextResponse.json({ error: 'You have already responded to this request.' }, { status: 409 });

    const response = await prisma.pressResponse.create({
      data: { pressRequestId: parseInt(id), startupId: startup.id, message: message.trim() },
    });

    const pressRequest = await prisma.pressRequest.findUnique({ where: { id: parseInt(id) } });
    if (pressRequest) {
      await notifyUser(pressRequest.userId, 'New Response to Your Press Request',
        `${startup.name} responded to "${pressRequest.title}".`, '/press');
    }

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error('POST /press/[id]/respond error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
