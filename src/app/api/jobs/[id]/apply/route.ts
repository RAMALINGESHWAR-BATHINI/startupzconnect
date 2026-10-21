import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Please log in to apply.' }, { status: 401 });

    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const job = await prisma.jobOpening.findUnique({ where: { id: jobId }, include: { startup: true } });
    if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

    // Fix #19: prevent founders from applying to their own startup jobs
    if (job.startup.founderId === decoded.id) {
      return NextResponse.json({ error: 'You cannot apply to your own startup\'s job.' }, { status: 400 });
    }

    const existing = await prisma.jobApplication.findFirst({ where: { jobId, userId: decoded.id } });
    if (existing) return NextResponse.json({ error: 'You have already applied for this job.' }, { status: 409 });

    const application = await prisma.jobApplication.create({ data: { jobId, userId: decoded.id } });
    return NextResponse.json(application, { status: 201 });
  } catch (err) {
    console.error('POST /jobs/[id]/apply error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
