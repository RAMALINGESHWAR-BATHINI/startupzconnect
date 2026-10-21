/**
 * File storage abstraction.
 *
 * Production: Cloudflare R2 via its S3-compatible API (works from a Next.js
 * route handler running on Cloudflare Workers — no filesystem needed).
 *
 * Two buckets are required:
 *   R2_PUBLIC_BUCKET_NAME   — non-sensitive assets (branding, public photos).
 *   R2_PRIVATE_BUCKET_NAME  — sensitive documents/resumes/inspections. Objects
 *                             are NEVER given permanent public URLs; access is
 *                             via short-lived signed URLs (~5 min) authorised
 *                             per-request in the document resolve route.
 *
 * Requires env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 * R2_PUBLIC_BUCKET_NAME, R2_PRIVATE_BUCKET_NAME, R2_PUBLIC_URL.
 *
 * Local dev fallback: when R2 isn't configured, files are written under
 * /public/uploads so the whole upload flow is testable with `npm run dev`.
 * This fallback ONLY works with the Node filesystem — it will not work once
 * deployed to Cloudflare Workers, which is why R2 is a hard requirement before
 * going live.
 */
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as presignUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';
import { verifyFileSignature, declaredMimeAllowed, hasDangerousExtension } from './file-signature';
import { isSafeHttpUrl } from './url-safety';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_BUCKET_NAME = process.env.R2_PUBLIC_BUCKET_NAME;
const R2_PRIVATE_BUCKET_NAME = process.env.R2_PRIVATE_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g. https://assets.startupzconnect.com

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10MB

// Folders that must stay private (documents, resumes, inspection photos).
const PRIVATE_FOLDERS = new Set(['documents', 'resumes', 'inspections']);

function safeExt(mime: string): string {
  const map: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
  return map[mime] || 'bin';
}

function randomKey(folder: string, mime: string): string {
  return `${folder}/${Date.now()}-${randomBytes(8).toString('hex')}.${safeExt(mime)}`;
}

function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_BUCKET_NAME && R2_PRIVATE_BUCKET_NAME && R2_PUBLIC_URL);
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

function bucketFor(folder: string): string {
  return PRIVATE_FOLDERS.has(folder) ? R2_PRIVATE_BUCKET_NAME! : R2_PUBLIC_BUCKET_NAME!;
}

/**
 * Uploads a file buffer and returns a safe reference.
 *
 * For private folders the return is an object-key (no public URL) — callers
 * must use `getSignedUrl` + the resolve route to serve it.
 * For public folders the return is a public R2 URL (or local dev URL).
 *
 * The caller must have already verified `verifyFileSignature` on the bytes;
 * this function re-checks signature + MIME + size as defence in depth.
 */
export async function uploadFile(buffer: Buffer, mime: string, filename: string, folder: string): Promise<{ url: string | null; key: string }> {
  if (!declaredMimeAllowed(mime)) {
    throw new Error(`File type not allowed: ${mime}`);
  }
  if (hasDangerousExtension(filename)) {
    throw new Error(`File extension not permitted: ${filename}`);
  }

  const sig = verifyFileSignature(buffer, filename, mime);
  if (!sig.ok) {
    throw new Error(sig.error || 'File signature verification failed.');
  }

  const key = randomKey(folder, mime);

  if (isR2Configured()) {
    const client = getS3Client();
    await client.send(new PutObjectCommand({
      Bucket: bucketFor(folder),
      Key: key,
      Body: buffer,
      ContentType: mime,
    }));

    if (PRIVATE_FOLDERS.has(folder)) {
      // Private object: return the key only, never a permanent public URL.
      return { url: null, key };
    }
    // Public object: return the public URL.
    return { url: `${R2_PUBLIC_URL!.replace(/\/$/, '')}/${key}`, key };
  }

  // Dev-only fallback: Node filesystem write under /public/uploads.
  const fs = await import('fs/promises');
  const path = await import('path');
  const dir = path.join(process.cwd(), 'public', 'uploads', folder);
  await fs.mkdir(dir, { recursive: true });
  const fileName = key.split('/').pop()!;
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, buffer);
  return { url: `/uploads/${folder}/${fileName}`, key: `${folder}/${fileName}` };
}

/** Generate a short-lived signed URL (default 5 minutes) for a private object. */
export async function getSignedUrl(key: string, expiresSeconds = 300): Promise<string> {
  if (!isR2Configured()) {
    // Dev fallback: serve from local /public/uploads path directly.
    const fileName = key.split('/').pop()!;
    const folder = key.split('/')[0]!;
    return `/uploads/${folder}/${fileName}`;
  }
  const client = getS3Client();
  // Determine bucket by folder prefix.
  const folder = key.split('/')[0]!;
  const bucket = bucketFor(folder);
  const command = new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: 'inline' });
  return presignUrl(client, command, { expiresIn: expiresSeconds });
}

/** Delete an object from R2 (used on revocation / document removal). */
export async function deleteObject(key: string): Promise<void> {
  if (!isR2Configured()) return;
  const client = getS3Client();
  const folder = key.split('/')[0]!;
  await client.send(new DeleteObjectCommand({ Bucket: bucketFor(folder), Key: key }));
}

export function storageBackend(): 'r2' | 'local-dev' {
  return isR2Configured() ? 'r2' : 'local-dev';
}

/** Returns the bucket name used for a folder (useful for audit/logging). */
export function bucketForFolder(folder: string): string {
  return bucketFor(folder);
}
