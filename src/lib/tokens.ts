import crypto from 'crypto';

/** Generates a URL-safe random token for email verification / password reset / invitation links. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/** Hash a single-use token before storing it — never store plaintext tokens. */
export async function hashToken(token: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(token, 12);
}

/** Verify a plaintext single-use token against its stored hash. */
export async function verifyToken(token: string, hashed: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(token, hashed);
}

/** Generates a single-use token and its hash, ready for storage. */
export async function generateSingleUseToken(): Promise<{ token: string; hash: string }> {
  const token = generateToken();
  const hash = await hashToken(token);
  return { token, hash };
}
