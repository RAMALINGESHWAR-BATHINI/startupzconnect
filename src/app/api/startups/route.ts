import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const domain = searchParams.get('domain');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { domain: { contains: search } },
      ];
    }
    if (domain) where.domain = domain;

    const [startups, total] = await Promise.all([
      prisma.startup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { founder: { select: { id: true, name: true } }, _count: { select: { jobOpenings: true } } }
      }),
      prisma.startup.count({ where })
    ]);

    return NextResponse.json({ 
      startups, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit) 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyAccessToken(token) as any;
    if (!decoded || (decoded.role !== 'FOUNDER' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, domain, description } = await request.json();
    if (!name) return NextResponse.json({ error: 'Startup name is required.' }, { status: 400 });

    const startup = await prisma.startup.create({
      data: { name, domain, description, founderId: decoded.id }
    });

    return NextResponse.json(startup, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
