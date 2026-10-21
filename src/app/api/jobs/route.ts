import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const type = searchParams.get('type');
    const location = searchParams.get('location');
    const skip = (page - 1) * limit;

    const where: any = { isOpen: true };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { skills: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (type) where.type = type;
    if (location) where.location = location;

    const [jobs, total] = await Promise.all([
      prisma.jobOpening.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          startup: { select: { id: true, name: true, domain: true, badgeTier: true } },
          _count: { select: { jobApplications: true } },
        },
      }),
      prisma.jobOpening.count({ where }),
    ]);
    return NextResponse.json({ jobs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('GET /jobs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { startupId, title, description, skills, type, location, salaryMin, salaryMax } = await request.json();
    if (!startupId || !title?.trim()) return NextResponse.json({ error: 'startupId and title are required.' }, { status: 400 });
    if (title.trim().length > 100) return NextResponse.json({ error: 'Title too long.' }, { status: 400 });

    const startup = await prisma.startup.findUnique({ where: { id: startupId } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You can only post jobs for your own startup.' }, { status: 403 });
    }

    const VALID_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
    const VALID_LOCATIONS = ['Remote', 'Hybrid', 'On-site'];
    if (type && !VALID_TYPES.includes(type)) return NextResponse.json({ error: 'Invalid job type.' }, { status: 400 });
    if (location && !VALID_LOCATIONS.includes(location)) return NextResponse.json({ error: 'Invalid location type.' }, { status: 400 });

    const job = await prisma.jobOpening.create({
      data: {
        startupId, title: title.trim(),
        description: description?.trim() || null,
        skills: skills?.trim() || null,
        type: type || null,
        location: location || null,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
      },
    });
    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    console.error('POST /jobs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
