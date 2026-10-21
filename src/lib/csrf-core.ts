/**
 * CSRF defence for cookie-authenticated, state-changing requests. SameSite=Strict on the
 * auth cookies is layer one; this is layer two: every unsafe request must come from our own
 * origin, judged from headers a browser sets and a web page cannot forge (Origin, Sec-Fetch-Site).
 */
export interface CsrfInput {
  method: string; origin?: string | null; referer?: string | null; host?: string | null;
  secFetchSite?: string | null; requestUrl: string; allowedOrigins?: readonly string[];
}
export type CsrfResult = { ok: true } | { ok: false; reason: string };
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function checkCsrf(i: CsrfInput): CsrfResult {
  if (SAFE_METHODS.has(i.method.toUpperCase())) return { ok: true };
  if (i.secFetchSite === 'cross-site') return { ok: false, reason: 'cross-site request' };

  let originStr: string | null = null;
  if (i.origin) {
    if (i.origin === 'null') return { ok: false, reason: 'opaque origin' };
    originStr = i.origin;
  } else if (i.referer) {
    try { originStr = new URL(i.referer).origin; } catch { return { ok: false, reason: 'invalid referer' }; }
  } else if (i.secFetchSite === 'same-origin') {
    return { ok: true };
  } else {
    return { ok: false, reason: 'missing origin' };
  }

  let parsed: URL;
  try { parsed = new URL(originStr); } catch { return { ok: false, reason: 'invalid origin' }; }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { ok: false, reason: 'invalid origin' };

  let selfOrigin = '';
  try { selfOrigin = new URL(i.requestUrl).origin; } catch { /* use the other checks */ }
  const allowed = new Set([selfOrigin, ...(i.allowedOrigins ?? [])].filter(Boolean));
  if (allowed.has(parsed.origin)) return { ok: true };
  // Host is set by the browser for the site being visited; an attacker's page cannot choose it.
  if (i.host && parsed.host === i.host) return { ok: true };
  return { ok: false, reason: 'origin not allowed' };
}
