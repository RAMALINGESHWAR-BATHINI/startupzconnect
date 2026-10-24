import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth'
import { hasLiveAdminRole, hasOrgMembership } from '@/lib/admin-auth';
import { isEmailVerified, unverifiedResponse } from '@/lib/guards';

const ALLOWED_TYPES = ['DEMO_DAY', 'PITCH_COMPETITION', 'MEETUP', 'WORKSHOP', 'OTHER'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const where: any = { eventDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }; // hide events >1 day past
    if (type) where.type = type;

    const events = await prisma.event.findMany({
      where, orderBy: { eventDate: 'asc' },
      include: { startup: { select: { name: true } }, _count: { select: { rsvps: true } } },
    });
    return NextResponse.json(events);
  } catch (err) {
    console.error('GET /events error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isEmailVerified(decoded.id))) return unverifiedResponse();
    if (decoded.role !== 'STARTUP' && !(await hasLiveAdminRole(decoded.id))) {
      return NextResponse.json({ error: 'Only startup accounts can post events.' }, { status: 403 });
    }

    const { title, description, type, startupId, organizerName, eventDate, location, isVirtual, joinLink } = await request.json();
    if (!title?.trim() || !ALLOWED_TYPES.includes(type) || !eventDate) {
      return NextResponse.json({ error: 'Title, a valid type, and an event date are required.' }, { status: 400 });
    }
    if (new Date(eventDate) < new Date()) return NextResponse.json({ error: 'Event date must be in the future.' }, { status: 400 });

    if (startupId) {
      const startup = await prisma.startup.findUnique({ where: { id: parseInt(startupId) } });
      const isFounder = startup?.founderId === decoded.id;
      const isLiveAdmin = await hasLiveAdminRole(decoded.id);
      const isOrgAdmin = startup ? await hasOrgMembership(decoded.id, startup.organizationId, 'ADMIN') : false;
      if (!startup || (!isFounder && !isLiveAdmin && !isOrgAdmin)) {
        return NextResponse.json({ error: 'You can only post events for your own startup.' }, { status: 403 });
      }
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim(), description: description?.trim() || null, type,
        startupId: startupId ? parseInt(startupId) : null,
        organizerName: organizerName?.trim() || 'StartupzConnect Community',
        eventDate: new Date(eventDate), location: location?.trim() || null,
        isVirtual: !!isVirtual, joinLink: joinLink?.trim() || null,
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error('POST /events error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


