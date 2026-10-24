import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth'
import { hasLiveAdminRole } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const { weekOf, summary, hoursSpent, milestone } = await request.json();
    if (!weekOf || !summary?.trim()) return NextResponse.json({ error: 'weekOf and summary are required.' }, { status: 400 });
    if (summary.trim().length < 20) return NextResponse.json({ error: 'Summary must be at least 20 characters.' }, { status: 400 });

    const log = await prisma.workLog.create({
      data: { startupId: parseInt(id), weekOf, summary: summary.trim(), hoursSpent: hoursSpent ? parseInt(hoursSpent) : null, milestone: !!milestone },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error('POST /worklog error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



