import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyAccessToken, clearAuthCookies } from '@/lib/auth';

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { password } = await request.json();
    if (!password) return NextResponse.json({ error: 'Please enter your password to confirm account deletion.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 });

    // Cascading deletes in the schema (onDelete: Cascade) remove the user's
    // startups, applications, reviews, check-ins, etc. along with the account.
    await prisma.user.delete({ where: { id: decoded.id } });

    await clearAuthCookies();
    return NextResponse.json({ message: 'Your account has been permanently deleted.' });
  } catch (err) {
    console.error('DELETE /auth/account error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
