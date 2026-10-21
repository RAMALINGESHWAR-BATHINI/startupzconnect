import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyRefreshToken, signAccessToken, signRefreshToken, attachAuthCookies } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('refreshToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No refresh token.' }, { status: 401 });
    }

    const decoded = verifyRefreshToken(token) as any;
    if (!decoded?.id) {
      return NextResponse.json({ error: 'Invalid or expired refresh token.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== token) {
      // Token reuse detected or user deleted — reject
      return NextResponse.json({ error: 'Refresh token revoked.' }, { status: 401 });
    }

    // Rotate both tokens
    const newAccessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    attachAuthCookies(response, newAccessToken, newRefreshToken);
    return response;
  } catch (err) {
    console.error('Refresh error:', err);
    return NextResponse.json({ error: 'Token refresh failed.' }, { status: 500 });
  }
}
