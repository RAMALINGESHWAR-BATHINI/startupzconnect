import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const partners = await prisma.institutionPartner.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(partners);
  } catch (err) {
    console.error('GET /institutions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
