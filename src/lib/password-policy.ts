/**
 * Password rules, shared by the server (authoritative) and the registration wizard (strength meter).
 * Length matters more than composition: a long passphrase passes with no symbols, while a short
 * password must mix character types.
 */
export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128; // bcrypt ignores bytes past 72; this just bounds input size

const COMMON = new Set([
  'password', 'password1', 'password12', 'password123', '1234567890', '12345678910', 'qwertyuiop', 'qwerty123456',
  'iloveyou123', 'welcome123', 'admin12345', 'letmein1234', 'abc1234567', 'monkey12345', 'dragon12345',
  'passw0rd123', 'changeme123', 'startup1234', 'startupzconnect', 'india12345', 'football123', 'sunshine123',
]);
export interface PasswordContext { email?: string; name?: string }

function classes(pw: string): number {
  return [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
}
function containsIdentity(pw: string, ctx: PasswordContext): boolean {
  const lower = pw.toLowerCase();
  const local = ctx.email?.split('@')[0]?.toLowerCase() ?? '';
  if (local.length >= 4 && lower.includes(local)) return true;
  return (ctx.name ?? '').toLowerCase().split(/\s+/).some(part => part.length >= 4 && lower.includes(part));
}

export function passwordStrength(pw: string, ctx: PasswordContext = {}): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  if (!pw || pw.length < 6) return { score: 0, label: labels[0] };
  let pts = 0;
  if (pw.length >= 10) pts++;
  if (pw.length >= 14) pts++;
  if (classes(pw) >= 3) pts++;
  if (classes(pw) >= 4 && pw.length >= 12) pts++;
  if (COMMON.has(pw.toLowerCase()) || containsIdentity(pw, ctx)) pts = Math.min(pts, 1);
  const score = Math.min(4, pts) as 0 | 1 | 2 | 3 | 4;
  return { score, label: labels[score] };
}

export function validatePassword(pw: unknown, ctx: PasswordContext = {}): { ok: true } | { ok: false; errors: string[] } {
  if (typeof pw !== 'string') return { ok: false, errors: ['Password is required.'] };
  const errors: string[] = [];
  if (pw.length < MIN_PASSWORD_LENGTH) errors.push(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (pw.length > MAX_PASSWORD_LENGTH) errors.push(`Use at most ${MAX_PASSWORD_LENGTH} characters.`);
  if (COMMON.has(pw.toLowerCase())) errors.push('That password is too common.');
  if (containsIdentity(pw, ctx)) errors.push('Do not include your name or email in your password.');
  if (errors.length === 0 && passwordStrength(pw, ctx).score < 2) {
    errors.push('Use 14 or more characters, or 10 or more with upper and lower case letters plus numbers or symbols.');
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}
