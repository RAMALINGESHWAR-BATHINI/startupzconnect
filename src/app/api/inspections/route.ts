import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

const ALLOWED_TIERS = ['BASIC', 'PREMIUM'] as const;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { startupId, tier, preferredDate, notes } = await request.json();
    if (!startupId) return NextResponse.json({ error: 'startupId is required.' }, { status: 400 });
    if (!ALLOWED_TIERS.includes(tier)) {
      return NextResponse.json({ error: 'Invalid inspection package.' }, { status: 400 });
    }

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(startupId) } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You can only request inspection for your own startup.' }, { status: 403 });
    }

    // Don't allow stacking requests while one is already in flight.
    const inFlight = await prisma.inspectionReport.findFirst({
      where: { startupId: startup.id, status: { in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'SUBMITTED'] } },
    });
    if (inFlight) {
      return NextResponse.json({ error: 'An inspection is already in progress for this startup.' }, { status: 409 });
    }

    // Naive agent match: any active agent. City-based matching is a later upgrade.
    // If nobody is available the request is still saved as PENDING (no agent yet)
    // instead of being silently dropped.
    const agent = await prisma.fieldAgent.findFirst({ where: { isActive: true } });

    const inspection = await prisma.inspectionReport.create({
      data: {
        startupId: startup.id,
        agentId: agent?.id ?? null,
        tier,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        requestNotes: notes?.trim() || null,
        status: agent ? 'SCHEDULED' : 'PENDING',
      },
    });
    return NextResponse.json(inspection, { status: 201 });
  } catch (err) {
    console.error('POST /inspections error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
