import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { computeHealthScore, displayBadgeTier } from '@/lib/badges';

const ALLOWED_DOMAINS = ['AI','FinTech','HealthTech','EdTech','SaaS','E-commerce','Logistics','CleanTech','GameTech','Other'];
const ALLOWED_STAGES = ['IDEA','MVP','PRE_SEED','SEED','SERIES_A','SERIES_B','BOOTSTRAPPED'];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const startupId = parseInt(id);
    if (isNaN(startupId)) return NextResponse.json({ error: 'Invalid startup ID.' }, { status: 400 });

    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    const decoded = token ? (verifyAccessToken(token) as any) : null;
    const isLoggedIn = !!decoded;

    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      include: {
        founder: { select: { id: true, name: true, ...(isLoggedIn ? { email: true } : {}) } },
        jobOpenings: { orderBy: { createdAt: 'desc' } },
        teamMembers: { orderBy: { isFounder: 'desc' } },
        workLogs: { orderBy: { weekOf: 'desc' }, take: 20 },
        inspections: { where: { status: 'APPROVED' }, orderBy: { approvedAt: 'desc' }, take: 1 },
        _count: { select: { collaborationRequests: true, investmentInterests: true, reviews: true } },
      },
    });

    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });

    const avgAgg = await prisma.startupReview.aggregate({
      where: { startupId },
      _avg: { overallRating: true },
    });

    const effectiveBadgeTier = displayBadgeTier(startup.badgeTier, startup.lastInspectedAt);
    const healthScore = computeHealthScore({
      badgeTier: startup.badgeTier,
      inspectionScore: startup.inspectionScore,
      employeeCount: startup.employeeCount,
      monthlyUsers: startup.monthlyUsers,
      totalFundingRaised: startup.totalFundingRaised,
      updatedAt: startup.updatedAt,
      lastInspectedAt: startup.lastInspectedAt,
      reviewCount: startup._count.reviews,
      avgReviewRating: avgAgg._avg.overallRating,
    });

    return NextResponse.json({
      ...startup,
      badgeTier: effectiveBadgeTier,       // expiry-aware — downgrades automatically after 18 months
      rawBadgeTier: startup.badgeTier,      // the un-downgraded value, for admin/debug use
      healthScore,
    });
  } catch (err) {
    console.error('GET /startups/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const startupId = parseInt(id);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const startup = await prisma.startup.findUnique({ where: { id: startupId } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await prisma.startup.delete({ where: { id: startupId } });
    return NextResponse.json({ message: 'Startup deleted.' });
  } catch (err) {
    console.error('DELETE /startups/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const startupId = parseInt(id);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const startup = await prisma.startup.findUnique({ where: { id: startupId } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, domain, description, stage, employeeCount, websiteUrl, monthlyUsers, monthlyRevenue, totalFundingRaised, institutionPartnerId } = body;

    if (name && name.trim().length < 2) return NextResponse.json({ error: 'Name too short.' }, { status: 400 });
    if (name && name.trim().length > 100) return NextResponse.json({ error: 'Name too long.' }, { status: 400 });
    if (domain && !ALLOWED_DOMAINS.includes(domain)) return NextResponse.json({ error: 'Invalid domain.' }, { status: 400 });
    if (stage && !ALLOWED_STAGES.includes(stage)) return NextResponse.json({ error: 'Invalid stage.' }, { status: 400 });

    const updated = await prisma.startup.update({
      where: { id: startupId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(domain !== undefined ? { domain } : {}),
        ...(description !== undefined ? { description: description?.trim() } : {}),
        ...(stage ? { stage } : {}),
        ...(employeeCount ? { employeeCount: parseInt(employeeCount) } : {}),
        ...(websiteUrl !== undefined ? { websiteUrl: websiteUrl?.trim() || null } : {}),
        ...(monthlyUsers !== undefined ? { monthlyUsers: monthlyUsers ? parseInt(monthlyUsers) : null } : {}),
        ...(monthlyRevenue !== undefined ? { monthlyRevenue: monthlyRevenue ? parseFloat(monthlyRevenue) : null } : {}),
        ...(totalFundingRaised !== undefined ? { totalFundingRaised: totalFundingRaised ? parseFloat(totalFundingRaised) : null } : {}),
        ...(institutionPartnerId !== undefined ? { institutionPartnerId: institutionPartnerId ? parseInt(institutionPartnerId) : null } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /startups/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
