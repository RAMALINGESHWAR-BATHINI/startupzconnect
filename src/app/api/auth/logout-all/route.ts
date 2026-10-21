import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, clearAuthCookies } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Clearing the stored refresh token invalidates every other session —
    // any device using the old refresh token will be forced to log in again.
    await prisma.user.update({ where: { id: decoded.id }, data: { refreshToken: null } });
    await clearAuthCookies();

    return NextResponse.json({ message: 'Logged out of all devices.' });
  } catch (err) {
    console.error('POST /auth/logout-all error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
