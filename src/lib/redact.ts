/**
 * Redaction for anything written to the audit log: secrets replaced, email addresses
 * masked, long strings truncated, total size capped — so the log never becomes a place
 * where credentials or unnecessary personal data accumulate.
 */
const SECRET_KEY = /pass(word)?|secret|token|authorization|cookie|api[_-]?key|private[_-]?key|otp|session|credential/i;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const MAX_STRING = 300;
const MAX_JSON = 2000;

function maskEmail(m: string): string {
  const [local, domain] = m.split('@');
  return `${local[0] ?? ''}***@${domain[0] ?? ''}***`;
}
export function redactValue(v: unknown, depth = 0): unknown {
  if (v === null || v === undefined) return v;
  if (typeof v === 'string') {
    const masked = v.replace(EMAIL, maskEmail);
    return masked.length > MAX_STRING ? masked.slice(0, MAX_STRING) + '…' : masked;
  }
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  if (depth >= 4) return '[TRUNCATED]';
  if (Array.isArray(v)) return v.slice(0, 20).map(x => redactValue(x, depth + 1));
  if (typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 30)) {
      out[k] = SECRET_KEY.test(k) ? '[REDACTED]' : redactValue(val, depth + 1);
    }
    return out;
  }
  return String(v).slice(0, 50);
}
/** JSON string safe to store in AuditLog.metadata (always valid JSON, always <= ~2KB). */
export function serializeMetadata(meta: unknown): string | null {
  if (meta === undefined || meta === null) return null;
  const json = JSON.stringify(redactValue(meta));
  if (json.length <= MAX_JSON) return json;
  // The preview is itself JSON-escaped when embedded (quotes double in size), so shrink it
  // until the final string — not just the preview — fits within the cap.
  let n = MAX_JSON - 60;
  let out = '';
  do {
    out = JSON.stringify({ truncated: true, preview: json.slice(0, n) });
    n -= 50;
  } while (out.length > MAX_JSON && n > 0);
  return out.length > MAX_JSON ? JSON.stringify({ truncated: true }) : out;
}
