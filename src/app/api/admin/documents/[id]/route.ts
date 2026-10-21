import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded || decoded.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { approve, notes } = await request.json();
    const doc = await prisma.startupDocument.findUnique({ where: { id: parseInt(id) } });
    if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

    await prisma.startupDocument.update({
      where: { id: doc.id },
      data: { status: approve ? 'VERIFIED' : 'REJECTED', reviewNotes: notes?.trim() || null, reviewedBy: decoded.id },
    });

    if (approve) {
      // First verified document is enough to unlock the Registered badge
      // (badge only upgrades — never overwrites a higher tier like FIELD_VERIFIED).
      const startup = await prisma.startup.findUnique({ where: { id: doc.startupId } });
      if (startup && startup.badgeTier === 'NONE') {
        await prisma.startup.update({ where: { id: startup.id }, data: { badgeTier: 'REGISTERED', documentsVerified: true } });
      } else if (startup) {
        await prisma.startup.update({ where: { id: startup.id }, data: { documentsVerified: true } });
      }
    }

    return NextResponse.json({ message: approve ? 'Document verified.' : 'Document rejected.' });
  } catch (err) {
    console.error('PATCH /admin/documents/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
