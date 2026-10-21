import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signAccessToken, signRefreshToken, attachAuthCookies } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Use a generic message to prevent user enumeration
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    // Fix #1: attach cookies directly onto the response object
    attachAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
