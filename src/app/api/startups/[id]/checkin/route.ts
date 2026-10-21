import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const startupId = parseInt(id);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Please log in to check in.' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { purpose } = await request.json();
    const VALID = ['JOB_INTERVIEW','INVESTOR_MEETING','OFFICE_VISIT','COLLABORATION'];
    if (!VALID.includes(purpose)) return NextResponse.json({ error: 'Invalid purpose.' }, { status: 400 });

    const startup = await prisma.startup.findUnique({ where: { id: startupId } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId === decoded.id) return NextResponse.json({ error: 'Founders cannot check in to their own startup.' }, { status: 400 });

    const checkIn = await prisma.officeCheckIn.create({
      data: { startupId, userId: decoded.id, purpose },
    });
    return NextResponse.json({ message: 'Checked in! You can now leave a review.', checkIn }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
