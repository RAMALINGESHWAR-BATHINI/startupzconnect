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

    const { mentorExpertise, mentorAvailability, mentorBio } = await request.json();
    if (!mentorExpertise?.trim() || !mentorBio?.trim()) {
      return NextResponse.json({ error: 'Expertise and bio are required.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: decoded.id },
      data: { mentorExpertise: mentorExpertise.trim(), mentorAvailability: mentorAvailability?.trim() || null, mentorBio: mentorBio.trim(), mentorIsActive: true },
    });
    return NextResponse.json({ message: 'Mentor profile saved and now visible to founders.' });
  } catch (err) {
    console.error('PUT /auth/mentor-profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
