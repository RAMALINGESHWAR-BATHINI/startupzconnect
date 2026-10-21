import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { investorNetWorth, investorTicketSize, investorThesis, investorSectors, investorPastDeals, sebiRegNumber, preferredStages } = await request.json();
    if (!investorNetWorth) return NextResponse.json({ error: 'Net worth bracket is required.' }, { status: 400 });

    await prisma.user.update({
      where: { id: decoded.id },
      data: { investorNetWorth, investorTicketSize: investorTicketSize || null, investorThesis: investorThesis || null, investorSectors: investorSectors || null, investorPastDeals: investorPastDeals || null, sebiRegNumber: sebiRegNumber || null },
    });
    return NextResponse.json({ message: 'Investor profile saved. Under review for verification.' });
  } catch (err) {
    console.error('PUT /investor-profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
