import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const expertise = searchParams.get('expertise');
    const where: any = { mentorIsActive: true, role: 'MENTOR' };
    if (expertise) where.mentorExpertise = { contains: expertise };

    const mentors = await prisma.user.findMany({
      where,
      select: { id: true, name: true, mentorExpertise: true, mentorAvailability: true, mentorBio: true },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(mentors);
  } catch (err) {
    console.error('GET /mentors error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
