import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Please log in to express investment interest.' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { startupId, amount, message } = await request.json();
    if (!startupId) return NextResponse.json({ error: 'startupId is required.' }, { status: 400 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(startupId) } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });

    // Fix #19: founders cannot invest in their own startup
    if (startup.founderId === decoded.id) {
      return NextResponse.json({ error: 'You cannot invest in your own startup.' }, { status: 400 });
    }

    const existing = await prisma.investmentInterest.findFirst({
      where: { startupId: parseInt(startupId), userId: decoded.id },
    });
    if (existing) return NextResponse.json({ error: 'You have already expressed interest in this startup.' }, { status: 409 });

    const parsedAmount = amount ? parseFloat(amount) : null;
    if (parsedAmount !== null && (isNaN(parsedAmount) || parsedAmount < 0)) {
      return NextResponse.json({ error: 'Invalid investment amount.' }, { status: 400 });
    }

    const interest = await prisma.investmentInterest.create({
      data: { startupId: parseInt(startupId), userId: decoded.id, amount: parsedAmount, message: message?.trim() || null },
    });
    return NextResponse.json(interest, { status: 201 });
  } catch (err) {
    console.error('POST /investments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
