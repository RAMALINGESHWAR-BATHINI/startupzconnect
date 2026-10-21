import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const startups = await prisma.startup.findMany({
      select: { id: true, name: true, domain: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(startups);
  } catch (err) {
    console.error('GET /startups/all error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
