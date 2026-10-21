import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const ALLOWED_ROLES = ['STUDENT', 'PROFESSIONAL', 'STARTUP', 'INVESTOR', 'OTHER'] as const;

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
    }

    // Never accept ADMIN or arbitrary values from client
    const safeRole = ALLOWED_ROLES.includes(role) ? role : 'STUDENT';

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase().trim(), password: hashedPassword, role: safeRole },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ message: 'User registered successfully', user }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
