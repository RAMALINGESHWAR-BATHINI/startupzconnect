import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

const ALLOWED_DOC_TYPES = ['INCORPORATION', 'GST', 'DPIIT', 'SHOP_ACT', 'OTHER'];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(id) } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const docs = await prisma.startupDocument.findMany({ where: { startupId: parseInt(id) }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(docs);
  } catch (err) {
    console.error('GET /documents error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const startup = await prisma.startup.findUnique({ where: { id: parseInt(id) } });
    if (!startup) return NextResponse.json({ error: 'Startup not found.' }, { status: 404 });
    if (startup.founderId !== decoded.id && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { docType, fileUrl } = await request.json();
    if (!ALLOWED_DOC_TYPES.includes(docType)) return NextResponse.json({ error: 'Invalid document type.' }, { status: 400 });
    if (!fileUrl?.trim()) return NextResponse.json({ error: 'A document link is required.' }, { status: 400 });
    try { new URL(fileUrl); } catch { return NextResponse.json({ error: 'Please provide a valid URL.' }, { status: 400 }); }

    const doc = await prisma.startupDocument.create({
      data: { startupId: parseInt(id), docType, fileUrl: fileUrl.trim() },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error('POST /documents error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
