import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { startupId, tier, preferredDate, notes } = await request.json();
    if (!startupId) return NextResponse.json({ error: 'startupId is required.' }, { status: 400 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(startupId) } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You can only request inspection for your own startup.' }, { status: 403 });
    }

    // Find any available agent (in real app, would match by city)
    const agent = await prisma.fieldAgent.findFirst({ where: { isActive: true } });
    if (!agent) {
      // Still create the request; admin will assign agent manually
      return NextResponse.json({ message: 'Inspection request received. An agent will be assigned shortly.', status: 'PENDING' }, { status: 201 });
    }

    const inspection = await prisma.inspectionReport.create({
      data: { startupId: parseInt(startupId), agentId: agent.id, status: 'SCHEDULED' },
    });
    return NextResponse.json(inspection, { status: 201 });
  } catch (err) {
    console.error('POST /inspections error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
