import { NextResponse } from 'next/server';
import { notifyAdmin } from '@/lib/alerts';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { uploadFile, ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES, MAX_IMAGE_BYTES, MAX_DOC_BYTES } from '@/lib/storage';

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

    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    if (!ALLOWED_FOLDERS.includes(folder as Folder)) return NextResponse.json({ error: 'Invalid upload destination.' }, { status: 400 });

    const kind = kindFor(folder as Folder);
    const allowedTypes = kind === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
    const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_DOC_BYTES;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `File type not allowed. Accepted: ${allowedTypes.join(', ')}` }, { status: 400 });
    }
    if (file.size > maxBytes) {
      return NextResponse.json({ error: `File too large. Max ${Math.round(maxBytes / (1024 * 1024))}MB.` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(buffer, file.type, folder);

    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error('POST /uploads error:', err);
    await notifyAdmin('POST /uploads error', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
