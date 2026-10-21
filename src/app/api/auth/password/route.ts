import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required.' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: decoded.id }, data: { password: hashed } });

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('PUT /auth/password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
