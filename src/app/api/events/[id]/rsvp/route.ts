import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Please log in to RSVP.' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.eventRSVP.findFirst({ where: { eventId: parseInt(id), userId: decoded.id } });
    if (existing) return NextResponse.json({ error: 'You have already RSVP\'d to this event.' }, { status: 409 });

    const rsvp = await prisma.eventRSVP.create({ data: { eventId: parseInt(id), userId: decoded.id } });
    return NextResponse.json(rsvp, { status: 201 });
  } catch (err) {
    console.error('POST /events/[id]/rsvp error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
