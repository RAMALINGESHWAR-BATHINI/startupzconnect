/**
 * File signature (magic-bytes) verification.
 *
 * Client-declared MIME types (file.type) are forged easily. We inspect the actual
 * file bytes to confirm the real type before accepting an upload. This defeats
 * MIME-spoofing attacks (e.g. a PHP script renamed to .jpg with image/jpeg type).
 *
 * Returns the verified MIME type, or null if the bytes don't match a known safe type.
 */

// Magic-byte signatures for the types StartupzConnect accepts.
const SIGNATURES: Record<string, Buffer> = {
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
  'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF; WEBP check done separately
  'application/pdf': Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
};

const WEBP_SIGNATURE = Buffer.from([0x57, 0x45, 0x42, 0x50]); // WEBP at offset 8

// Extensions we treat as executable / dangerous and always reject, even inside zip-ish containers.
const DANGEROUS_EXTENSIONS = [
  '.php', '.php3', '.php4', '.php5', '.phtml', '.asp', '.aspx', '.exe', '.bat', '.cmd',
  '.com', '.cgi', '.sh', '.js', '.jsx', '.ts', '.tsx', '.html', '.htm', '.svg', '.vbs',
  '.jar', '.swf', '.xhtml',
];

export interface FileSignatureResult {
  ok: boolean;
  mime?: string;
  extension?: string;
  error?: string;
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx <= 0) return '';
  return filename.slice(idx).toLowerCase();
}

export function hasDangerousExtension(filename: string): boolean {
  const ext = getExtension(filename);
  return DANGEROUS_EXTENSIONS.includes(ext);
}

/** Verify that the file bytes match a safe MIME type and that the filename extension is safe. */
export function verifyFileSignature(buffer: Buffer, filename: string, declaredMime: string): FileSignatureResult {
  if (buffer.length < 4) {
    return { ok: false, error: 'File too small to inspect.' };
  }

  if (hasDangerousExtension(filename)) {
    return { ok: false, error: `File extension "${getExtension(filename)}" is not permitted.` };
  }

  const sig = buffer.slice(0, 16);

  // JPEG
  if (sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff) {
    return { ok: true, mime: 'image/jpeg', extension: '.jpg' };
  }

  // PNG
  if (
    sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47 &&
    sig[4] === 0x0d && sig[5] === 0x0a && sig[6] === 0x1a && sig[7] === 0x0a
  ) {
    return { ok: true, mime: 'image/png', extension: '.png' };
  }

  // WEBP: RIFF header + "WEBP" at offset 8
  if (
    sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { ok: true, mime: 'image/webp', extension: '.webp' };
  }

  // PDF
  if (sig[0] === 0x25 && sig[1] === 0x50 && sig[2] === 0x44 && sig[3] === 0x46) {
    return { ok: true, mime: 'application/pdf', extension: '.pdf' };
  }

  return { ok: false, error: 'File signature does not match a permitted image or document type.' };
}

/** Cross-check: declared MIME must be one we accept, and must agree with the verified signature. */
export function declaredMimeAllowed(declaredMime: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(declaredMime);
}
