import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import { notifyAdmin } from '@/lib/alerts';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/notify';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'documents.verify' as Permission });
    if (auth instanceof NextResponse) return auth;
    const { actor } = auth;

    const { id } = await params;
    const { approve, notes } = await request.json();
    const doc = await prisma.startupDocument.findUnique({ where: { id: parseInt(id) } });
    if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

    await prisma.startupDocument.update({
      where: { id: doc.id },
      data: { status: approve ? 'VERIFIED' : 'REJECTED', reviewNotes: notes?.trim() || null, reviewedBy: actor.userId },
    });

    const startup = await prisma.startup.findUnique({ where: { id: doc.startupId } });

    if (approve) {
      if (startup && startup.badgeTier === 'NONE') {
        await prisma.startup.update({ where: { id: startup.id }, data: { badgeTier: 'REGISTERED', documentsVerified: true } });
      } else if (startup) {
        await prisma.startup.update({ where: { id: startup.id }, data: { documentsVerified: true } });
      }
      if (startup) {
        await notifyUser(startup.founderId, 'Document Verified ✓',
          `Your ${doc.docType.replace('_', ' ')} document for ${startup.name} was verified.`,
          `/dashboard/startups/${startup.id}/manage`);
      }
    } else if (startup) {
      await notifyUser(startup.founderId, 'Document Rejected',
        `Your ${doc.docType.replace('_', ' ')} document for ${startup.name} was rejected.${notes ? ` Reason: ${notes.trim()}` : ''}`,
        `/dashboard/startups/${startup.id}/manage`);
    }

    return NextResponse.json({ message: approve ? 'Document verified.' : 'Document rejected.' });
  } catch (err) {
    console.error('PATCH /admin/documents/[id] error:', err);
    await notifyAdmin('PATCH /admin/documents/[id] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
