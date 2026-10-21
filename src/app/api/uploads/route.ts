import { NextResponse } from 'next/server';
import { notifyAdmin } from '@/lib/alerts';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { uploadFile, ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES, MAX_IMAGE_BYTES, MAX_DOC_BYTES, storageBackend } from '@/lib/storage';
import { verifyFileSignature, declaredMimeAllowed, hasDangerousExtension } from '@/lib/file-signature';
import { auditLog } from '@/lib/admin-auth';

const ALLOWED_FOLDERS = ['team-photos', 'documents', 'resumes', 'inspections'] as const;
type Folder = typeof ALLOWED_FOLDERS[number];

function kindFor(folder: Folder): 'image' | 'document' {
  return folder === 'documents' || folder === 'resumes' ? 'document' : 'image';
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Please log in to upload files.' }, { status: 401 });
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') as string;
    const filename = (file as File)?.name || 'upload';

    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    if (!ALLOWED_FOLDERS.includes(folder as Folder)) return NextResponse.json({ error: 'Invalid upload destination.' }, { status: 400 });

    const kind = kindFor(folder as Folder);
    const allowedTypes = kind === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
    const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_DOC_BYTES;

    if (!declaredMimeAllowed(file.type)) {
      return NextResponse.json({ error: `File type not allowed. Accepted: ${allowedTypes.join(', ')}` }, { status: 400 });
    }
    if (file.size > maxBytes) {
      return NextResponse.json({ error: `File too large. Max ${Math.round(maxBytes / (1024 * 1024))}MB.` }, { status: 400 });
    }
    if (hasDangerousExtension(filename)) {
      return NextResponse.json({ error: `File extension not permitted: ${filename}` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // File signature verification — rejects MIME spoofing.
    const sig = verifyFileSignature(buffer, filename, file.type);
    if (!sig.ok) {
      return NextResponse.json({ error: sig.error || 'File signature verification failed.' }, { status: 400 });
    }

    const result = await uploadFile(buffer, sig.mime || file.type, filename, folder as Folder);

    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('cf-connecting-ip') ?? undefined;
    await auditLog({
      actorId: decoded.id,
      category: 'ADMIN_ACTION',
      action: 'upload.create',
      severity: 'INFO',
      outcome: 'SUCCESS',
      targetType: 'file',
      targetId: result.key,
      ip,
      metadata: { folder, mime: sig.mime || file.type, size: file.size, backend: storageBackend() },
    });

    return NextResponse.json({ url: result.url, key: result.key, backend: storageBackend() }, { status: 201 });
  } catch (err) {
    console.error('POST /uploads error:', err);
    await notifyAdmin('POST /uploads error', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
