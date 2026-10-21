import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

const ALLOWED_TYPES = ['REVIEW', 'STARTUP', 'JOB', 'USER'];

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Please log in to report content.' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { contentType, contentId, reason } = await request.json();
    if (!ALLOWED_TYPES.includes(contentType)) return NextResponse.json({ error: 'Invalid content type.' }, { status: 400 });
    if (!contentId) return NextResponse.json({ error: 'contentId is required.' }, { status: 400 });
    if (!reason?.trim() || reason.trim().length < 10) {
      return NextResponse.json({ error: 'Please describe the issue in at least 10 characters.' }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: { contentType, contentId: parseInt(contentId), reportedBy: decoded.id, reason: reason.trim() },
    });

    // Reviews get flagged immediately so they carry a visible "under review" note;
    // final removal still requires admin action (policy §6.3 — flagging alone never deletes).
    if (contentType === 'REVIEW') {
      await prisma.startupReview.update({
        where: { id: parseInt(contentId) },
        data: { isFlagged: true, flagReason: reason.trim() },
      }).catch(() => {}); // if the review doesn't exist, the report itself still stands
    }

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error('POST /reports error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
