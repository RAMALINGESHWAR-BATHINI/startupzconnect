import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import {
  verifyRefreshToken,
  verifyTokenPurpose,
  signAccessToken,
  signRefreshToken,
  attachAuthCookies,
} from '@/lib/auth';
import { getSession, revokeSession, createSession } from '@/lib/sessions';

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

    // Token-purpose validation: a refresh token must have purpose 'refresh'.
    if (!verifyTokenPurpose(decoded, 'refresh')) {
      return NextResponse.json({ error: 'Invalid token purpose.' }, { status: 401 });
    }

    // Look up the session by hash comparison. Reject if not found / revoked / expired.
    const session = await getSession(token);
    if (!session || session.userId !== decoded.id) {
      // Token reuse detected or session revoked — revoke all sessions for this user (possible theft).
      await prisma.session.updateMany({
        where: { userId: decoded.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return NextResponse.json({ error: 'Refresh token revoked.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 401 });
    }

    // Rotate: revoke old session, create a new one with a new refresh token.
    await revokeSession(session.id);

    const newAccessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id });

    await createSession({ userId: user.id, token: newRefreshToken, ttlDays: 7 });

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
