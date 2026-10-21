import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { isEmailVerified, unverifiedResponse } from '@/lib/guards';

export async function GET() {
  try {
    const requests = await prisma.pressRequest.findMany({
      where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } }, _count: { select: { responses: true } } },
    });
    return NextResponse.json(requests);
  } catch (err) {
    console.error('GET /press error:', err);
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
    if (!(await isEmailVerified(decoded.id, decoded.role))) return unverifiedResponse();

    const { title, description, domain, deadline } = await request.json();
    if (!title?.trim() || !description?.trim()) return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });

    const req_ = await prisma.pressRequest.create({
      data: { userId: decoded.id, title: title.trim(), description: description.trim(), domain: domain || null, deadline: deadline ? new Date(deadline) : null },
    });
    return NextResponse.json(req_, { status: 201 });
  } catch (err) {
    console.error('POST /press error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
