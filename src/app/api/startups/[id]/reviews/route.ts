import { NextResponse } from 'next/server';
import { isEmailVerified, unverifiedResponse } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reviews = await prisma.startupReview.findMany({
      where: { startupId: parseInt(id) },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json(reviews);
  } catch (err) {
    console.error('GET /reviews error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Please log in to leave a review.' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!(await isEmailVerified(decoded.id, decoded.role))) return unverifiedResponse();

    const startupId = parseInt(id);
    const startup = await prisma.startup.findUnique({ where: { id: startupId } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId === decoded.id) return NextResponse.json({ error: 'You cannot review your own startup.' }, { status: 400 });

    const existing = await prisma.startupReview.findFirst({ where: { startupId, userId: decoded.id } });
    if (existing) return NextResponse.json({ error: 'You have already reviewed this startup.' }, { status: 409 });

    // Require a verified check-in before allowing a review
    const checkIn = await prisma.officeCheckIn.findFirst({ where: { startupId, userId: decoded.id } });
    const verifiedByCheckIn = !!checkIn;

    const { visitType, cultureRating, transparencyRating, professionalismRating, productRating, overallRating, reviewText, isAnonymous } = await request.json();

    if (!reviewText || reviewText.trim().length < 50) return NextResponse.json({ error: 'Review must be at least 50 characters.' }, { status: 400 });
    for (const r of [cultureRating, transparencyRating, professionalismRating, productRating, overallRating]) {
      if (!r || r < 1 || r > 5) return NextResponse.json({ error: 'All rating fields must be 1-5.' }, { status: 400 });
    }

    const review = await prisma.startupReview.create({
      data: { startupId, userId: decoded.id, visitType, cultureRating, transparencyRating, professionalismRating, productRating, overallRating, reviewText: reviewText.trim(), isAnonymous: !!isAnonymous, verifiedByCheckIn },
    });
    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error('POST /reviews error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
