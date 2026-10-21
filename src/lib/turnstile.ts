/**
 * Cloudflare Turnstile server-side verification. The browser token proves nothing until verified
 * here with the secret key (server-only). With no secret configured the check is skipped and reported
 * as `configured: false`; once configured, every failure — including Cloudflare being unreachable —
 * rejects the request (fail closed).
 */
export interface TurnstileOpts { secret?: string; fetchImpl?: typeof fetch; timeoutMs?: number }
export interface TurnstileResult { ok: boolean; configured: boolean; reason?: string }
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: unknown, ip: string | null, opts: TurnstileOpts = {}): Promise<TurnstileResult> {
  const secret = opts.secret ?? process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, configured: false };
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return { ok: false, configured: true, reason: 'missing token' };
  const doFetch = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 5000);
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const res = await doFetch(VERIFY_URL, { method: 'POST', body, signal: controller.signal });
    if (!res.ok) return { ok: false, configured: true, reason: 'verification service error' };
    const json = (await res.json()) as { success?: boolean };
    return json.success === true ? { ok: true, configured: true } : { ok: false, configured: true, reason: 'challenge failed' };
  } catch {
    return { ok: false, configured: true, reason: 'verification unavailable' };
  } finally {
    clearTimeout(timer);
  }
}
