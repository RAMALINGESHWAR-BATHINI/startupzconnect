/**
 * Validates that a user-supplied string is safe to store and later render
 * as an <a href> or <img src>. Only http(s) URLs are accepted; javascript:,
 * data:, vbscript:, file: and bare strings are rejected (React does not block
 * `javascript:` URIs in href/src, so unvalidated links become stored XSS).
 */
export function isSafeHttpUrl(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  // Reject control characters (newline injection, etc.)
  if (/[\u0000-\u001F\u007F]/.test(value)) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Matches the shape storage.ts generates for private object keys: "<folder>/<timestamp>-<32 hex>.<ext>". */
export function isOwnObjectKey(value: string, folder: 'documents' | 'resumes' | 'inspections'): boolean {
  const pattern = new RegExp(`^${folder}/\\d{10,}-[0-9a-f]{32}\\.(pdf|jpg|jpeg|png|webp)$`);
  return pattern.test(value);
}

/** Accepts either a safe http(s) link or one of our own generated object keys for that folder. */
export function isSafeStoredRef(value: string, folder: 'documents' | 'resumes' | 'inspections'): boolean {
  return isSafeHttpUrl(value) || isOwnObjectKey(value, folder);
}
