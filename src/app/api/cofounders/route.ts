import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { isEmailVerified, unverifiedResponse } from '@/lib/guards';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const commitment = searchParams.get('commitment');

    const where: any = { isActive: true };
    if (domain) where.domain = domain;
    if (commitment) where.commitment = commitment;

    const listings = await prisma.cofounderListing.findMany({
      where, orderBy: { updatedAt: 'desc' },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    return NextResponse.json(listings);
  } catch (err) {
    console.error('GET /cofounders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isEmailVerified(decoded.id, decoded.role))) return unverifiedResponse();

    const { lookingFor, skillsOffered, skillsWanted, commitment, domain, pitch } = await request.json();
    if (!lookingFor?.trim() || !skillsOffered?.trim() || !skillsWanted?.trim() || !commitment || !pitch?.trim()) {
      return NextResponse.json({ error: 'All fields except domain are required.' }, { status: 400 });
    }
    if (pitch.trim().length < 30) return NextResponse.json({ error: 'Pitch must be at least 30 characters.' }, { status: 400 });

    const listing = await prisma.cofounderListing.upsert({
      where: { userId: decoded.id },
      update: { lookingFor, skillsOffered, skillsWanted, commitment, domain: domain || null, pitch: pitch.trim(), isActive: true },
      create: { userId: decoded.id, lookingFor, skillsOffered, skillsWanted, commitment, domain: domain || null, pitch: pitch.trim() },
    });
    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    console.error('POST /cofounders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.cofounderListing.updateMany({ where: { userId: decoded.id }, data: { isActive: false } });
    return NextResponse.json({ message: 'Listing deactivated.' });
  } catch (err) {
    console.error('DELETE /cofounders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
