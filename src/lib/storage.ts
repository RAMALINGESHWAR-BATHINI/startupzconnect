/**
 * File storage abstraction.
 *
 * Production: Cloudflare R2 via its S3-compatible API (works from a Next.js
 * route handler running on Cloudflare Workers — no filesystem needed).
 * Requires these env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 * R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL.
 *
 * Local dev fallback: when those aren't set, files are written under
 * /public/uploads so the whole upload flow is testable with `npm run dev`
 * and no cloud account. This fallback ONLY works with the Node filesystem —
 * it will not work once deployed to Cloudflare Workers, which is why R2 is
 * a hard requirement before going live, not just for local testing.
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g. https://assets.startupzconnect.com

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10MB

function safeExt(mime: string): string {
  const map: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
  return map[mime] || 'bin';
}

function randomKey(folder: string, mime: string): string {
  return `${folder}/${Date.now()}-${randomBytes(8).toString('hex')}.${safeExt(mime)}`;
}

function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL);
}

let s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID!, secretAccessKey: R2_SECRET_ACCESS_KEY! },
    });
  }
  return s3Client;
}

/**
 * Uploads a file buffer and returns its public URL.
 * `folder` groups uploads for readability in the bucket/local dir, e.g.
 * "team-photos", "documents", "resumes", "inspections".
 */
export async function uploadFile(buffer: Buffer, mime: string, folder: string): Promise<string> {
  const key = randomKey(folder, mime);

  if (isR2Configured()) {
    const client = getS3Client();
    await client.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mime,
    }));
    return `${R2_PUBLIC_URL!.replace(/\/$/, '')}/${key}`;
  }

  // Dev-only fallback: Node filesystem write under /public/uploads.
  // Dynamic imports keep 'fs'/'path' out of the Cloudflare Workers bundle
  // when this branch is never taken in production.
  const fs = await import('fs/promises');
  const path = await import('path');
  const dir = path.join(process.cwd(), 'public', 'uploads', folder);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, key.split('/').pop()!);
  await fs.writeFile(filePath, buffer);
  return `/uploads/${folder}/${key.split('/').pop()}`;
}

export function storageBackend(): 'r2' | 'local-dev' {
  return isR2Configured() ? 'r2' : 'local-dev';
}
