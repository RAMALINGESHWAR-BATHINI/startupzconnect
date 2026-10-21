import { NextResponse } from 'next/server';
import { isEmailVerified, unverifiedResponse } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const ALLOWED_ORIGINS = ['INDEPENDENT','INSTITUTIONAL','ACCELERATOR','CORPORATE_SPINOFF','JV','GOVT_BACKED'];
const ALLOWED_STAGES = ['IDEA','MVP','PRE_SEED','SEED','SERIES_A','SERIES_B','BOOTSTRAPPED'];
const ALLOWED_DOMAINS = ['AI','FinTech','HealthTech','EdTech','SaaS','E-commerce','Logistics','CleanTech','GameTech','Other'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const domain = searchParams.get('domain');
    const stage = searchParams.get('stage');
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
    if (stage) where.stage = stage;

    const [startups, total] = await Promise.all([
      prisma.startup.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          founder: { select: { id: true, name: true } },
          _count: { select: { jobOpenings: true, reviews: true } },
        },
      }),
      prisma.startup.count({ where }),
    ]);

    return NextResponse.json({ startups, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('GET /startups error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyAccessToken(token) as any;
    if (!decoded || (decoded.role !== 'STARTUP' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Only startup accounts can create a startup profile.' }, { status: 403 });
    }

    if (!(await isEmailVerified(decoded.id, decoded.role))) return unverifiedResponse();

    const body = await request.json();
    const { name, domain, description, originType, institutionName, registrationId,
      registeredAddress, operationalAddress, foundedDate, stage, employeeCount, websiteUrl } = body;

    if (!name || name.trim().length < 2) return NextResponse.json({ error: 'Startup name must be at least 2 characters.' }, { status: 400 });
    if (name.trim().length > 100) return NextResponse.json({ error: 'Startup name must be under 100 characters.' }, { status: 400 });
    if (description && description.length > 2000) return NextResponse.json({ error: 'Description must be under 2000 characters.' }, { status: 400 });
    if (domain && !ALLOWED_DOMAINS.includes(domain)) return NextResponse.json({ error: 'Invalid domain.' }, { status: 400 });
    if (originType && !ALLOWED_ORIGINS.includes(originType)) return NextResponse.json({ error: 'Invalid origin type.' }, { status: 400 });
    if (stage && !ALLOWED_STAGES.includes(stage)) return NextResponse.json({ error: 'Invalid stage.' }, { status: 400 });
    if (['INSTITUTIONAL','ACCELERATOR'].includes(originType) && !institutionName?.trim()) {
      return NextResponse.json({ error: 'Institution/accelerator name is required for this origin type.' }, { status: 400 });
    }

    const startup = await prisma.startup.create({
      data: {
        name: name.trim(), domain: domain || null, description: description?.trim() || null,
        founderId: decoded.id,
        originType: originType || 'INDEPENDENT',
        institutionName: institutionName?.trim() || null,
        registrationId: registrationId?.trim() || null,
        registeredAddress: registeredAddress?.trim() || null,
        operationalAddress: operationalAddress?.trim() || null,
        foundedDate: foundedDate || null,
        stage: stage || 'IDEA',
        employeeCount: employeeCount ? parseInt(employeeCount) : 1,
        websiteUrl: websiteUrl?.trim() || null,
        badgeTier: registrationId?.trim() ? 'REGISTERED' : 'NONE',
        documentsVerified: false,
      },
    });

    return NextResponse.json(startup, { status: 201 });
  } catch (err) {
    console.error('POST /startups error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
