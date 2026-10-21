import { NextResponse } from 'next/server';
import { isEmailVerified, unverifiedResponse } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { notifyUser } from '@/lib/notify';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Please log in to send a collaboration request.' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!(await isEmailVerified(decoded.id))) return unverifiedResponse();

    const { startupId, message, fromStartupId } = await request.json();
    if (!startupId) return NextResponse.json({ error: 'startupId is required.' }, { status: 400 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(startupId) } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });

    if (fromStartupId) {
      // Startup-to-startup collaboration request.
      if (parseInt(fromStartupId) === startup.id) {
        return NextResponse.json({ error: 'A startup cannot collaborate with itself.' }, { status: 400 });
      }
      const fromStartup = await prisma.startup.findUnique({ where: { id: parseInt(fromStartupId) } });
      if (!fromStartup) return NextResponse.json({ error: 'Your startup was not found.' }, { status: 404 });
      if (fromStartup.founderId !== decoded.id && decoded.role !== 'ADMIN') {
        return NextResponse.json({ error: 'You can only send collaboration requests on behalf of your own startup.' }, { status: 403 });
      }

      const existingS2S = await prisma.collaborationRequest.findFirst({
        where: { startupId: startup.id, fromStartupId: fromStartup.id },
      });
      if (existingS2S) return NextResponse.json({ error: 'A collaboration request between these startups already exists.' }, { status: 409 });

      const collab = await prisma.collaborationRequest.create({
        data: { startupId: startup.id, fromStartupId: fromStartup.id, message: message?.trim() || null },
      });
      await notifyUser(startup.founderId, 'New Collaboration Request',
        `${fromStartup.name} wants to collaborate with ${startup.name}.`, `/startups/${startup.id}`);
      return NextResponse.json(collab, { status: 201 });
    }

    // Fix #19: founders cannot collaborate with their own startup
    if (startup.founderId === decoded.id) {
      return NextResponse.json({ error: 'You cannot collaborate with your own startup.' }, { status: 400 });
    }

    const existing = await prisma.collaborationRequest.findFirst({
      where: { startupId: parseInt(startupId), userId: decoded.id },
    });
    if (existing) return NextResponse.json({ error: 'You have already sent a collaboration request to this startup.' }, { status: 409 });

    const collab = await prisma.collaborationRequest.create({
      data: { startupId: parseInt(startupId), userId: decoded.id, message: message?.trim() || null },
    });
    await notifyUser(startup.founderId, 'New Collaboration Request',
      `Someone wants to collaborate with ${startup.name}.`, `/startups/${startup.id}`);
    return NextResponse.json(collab, { status: 201 });
  } catch (err) {
    console.error('POST /collaboration error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
