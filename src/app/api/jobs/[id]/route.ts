import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    if (isNaN(jobId)) return NextResponse.json({ error: 'Invalid job ID.' }, { status: 400 });

    const job = await prisma.jobOpening.findUnique({
      where: { id: jobId },
      include: { startup: { select: { id: true, name: true, domain: true, description: true } } },
    });
    if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    return NextResponse.json(job);
  } catch (err) {
    console.error('GET /jobs/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
