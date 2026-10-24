import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth'
import { hasLiveAdminRole } from '@/lib/admin-auth';
import { notifyUser } from '@/lib/notify';

export async function POST(request: Request, { params }: { params: Promise<{ id: string; reviewId: string }> }) {
  try {
    const { id, reviewId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(id) } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id && !(await hasLiveAdminRole(decoded.id))) {
      return NextResponse.json({ error: 'Only the startup owner can respond to reviews.' }, { status: 403 });
    }

    const review = await prisma.startupReview.findUnique({ where: { id: parseInt(reviewId) } });
    if (!review || review.startupId !== startup.id) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    if (review.startupResponse) return NextResponse.json({ error: 'A response has already been posted for this review.' }, { status: 409 });

    const { response } = await request.json();
    if (!response?.trim() || response.trim().length < 10) {
      return NextResponse.json({ error: 'Response must be at least 10 characters.' }, { status: 400 });
    }
    if (response.trim().length > 1000) {
      return NextResponse.json({ error: 'Response must be under 1000 characters.' }, { status: 400 });
    }

    const updated = await prisma.startupReview.update({
      where: { id: review.id },
      data: { startupResponse: response.trim() },
    });
    await notifyUser(review.userId, `${startup.name} responded to your review`,
      response.trim().slice(0, 140), `/startups/${startup.id}`);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('POST /reviews/[reviewId]/respond error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



