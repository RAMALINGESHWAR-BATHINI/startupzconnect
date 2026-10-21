import crypto from 'crypto';

/** Generates a URL-safe random token for email verification / password reset links. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
