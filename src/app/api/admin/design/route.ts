import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'design.settings.read' as Permission });
    if (auth instanceof NextResponse) return auth;

    const settings = await prisma.siteSetting.findMany({ take: 50 });
    return NextResponse.json({ settings });
  } catch (err) {
    console.error('GET /admin/design error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'design.content.publish' as Permission, sensitive: true });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { key, value } = await request.json();
    if (!key) return NextResponse.json({ error: 'key is required.' }, { status: 400 });

    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { draft: value, updatedBy: actor.userId, updatedAt: new Date() },
      create: { key, draft: value, updatedBy: actor.userId },
    });

    return NextResponse.json({ setting });
  } catch (err) {
    console.error('POST /admin/design error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
