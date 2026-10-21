import { describe, it, expect } from 'vitest';
import { generateToken, hoursFromNow } from '../tokens';

describe('generateToken', () => {
  it('returns a 64-character hex string', () => {
    const t = generateToken();
    expect(t).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never returns the same token twice', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });
});

describe('hoursFromNow', () => {
  it('returns a date roughly N hours in the future', () => {
    const now = Date.now();
    const future = hoursFromNow(24);
    const diffHours = (future.getTime() - now) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(23.9);
    expect(diffHours).toBeLessThan(24.1);
  });
});
