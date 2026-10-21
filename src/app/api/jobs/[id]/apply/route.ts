import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { isEmailVerified, unverifiedResponse } from '@/lib/guards';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Please log in to apply.' }, { status: 401 });

    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isEmailVerified(decoded.id))) return unverifiedResponse();

    const job = await prisma.jobOpening.findUnique({ where: { id: jobId }, include: { startup: true } });
    if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

    // Fix #19: prevent founders from applying to their own startup jobs
    if (job.startup.founderId === decoded.id) {
      return NextResponse.json({ error: 'You cannot apply to your own startup\'s job.' }, { status: 400 });
    }

    const existing = await prisma.jobApplication.findFirst({ where: { jobId, userId: decoded.id } });
    if (existing) return NextResponse.json({ error: 'You have already applied for this job.' }, { status: 409 });

    const { coverNote, resumeUrl } = await request.json().catch(() => ({ coverNote: undefined, resumeUrl: undefined }));
    if (resumeUrl) { try { new URL(resumeUrl); } catch { return NextResponse.json({ error: 'Please provide a valid resume URL.' }, { status: 400 }); } }

    const application = await prisma.jobApplication.create({
      data: { jobId, userId: decoded.id, coverNote: coverNote?.trim() || null, resumeUrl: resumeUrl?.trim() || null },
    });
    return NextResponse.json(application, { status: 201 });
  } catch (err) {
    console.error('POST /jobs/[id]/apply error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
