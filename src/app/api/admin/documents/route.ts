import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'documents.verify' as Permission });
    if (auth instanceof NextResponse) return auth;

    const docs = await prisma.startupDocument.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { startup: { select: { name: true, registrationId: true } } },
    });
    return NextResponse.json(docs);
  } catch (err) {
    console.error('GET /admin/documents error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
