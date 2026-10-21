import { describe, it, expect } from 'vitest';
import { isBadgeExpired, displayBadgeTier, computeHealthScore } from '../badges';

describe('isBadgeExpired', () => {
  it('is not expired when never inspected', () => {
    expect(isBadgeExpired(null)).toBe(false);
  });

  it('is not expired within 18 months', () => {
    const recent = new Date();
    recent.setMonth(recent.getMonth() - 6);
    expect(isBadgeExpired(recent)).toBe(false);
  });

  it('is expired after 18 months', () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 20);
    expect(isBadgeExpired(old)).toBe(true);
  });
});

describe('displayBadgeTier', () => {
  it('downgrades an expired FIELD_VERIFIED badge to REGISTERED', () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 20);
    expect(displayBadgeTier('FIELD_VERIFIED', old)).toBe('REGISTERED');
  });

  it('keeps a fresh FIELD_VERIFIED badge as-is', () => {
    const recent = new Date();
    expect(displayBadgeTier('FIELD_VERIFIED', recent)).toBe('FIELD_VERIFIED');
  });

  it('leaves NONE and REGISTERED untouched regardless of date', () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 30);
    expect(displayBadgeTier('NONE', old)).toBe('NONE');
    expect(displayBadgeTier('REGISTERED', old)).toBe('REGISTERED');
  });
});

describe('computeHealthScore', () => {
  it('returns 0-100 range for a minimal unverified startup', () => {
    const score = computeHealthScore({
      badgeTier: 'NONE', inspectionScore: null, employeeCount: 1,
      monthlyUsers: null, totalFundingRaised: null, updatedAt: new Date(),
      lastInspectedAt: null,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('scores a fully verified, funded startup higher than an unverified one', () => {
    const low = computeHealthScore({
      badgeTier: 'NONE', inspectionScore: null, employeeCount: 1,
      monthlyUsers: null, totalFundingRaised: null, updatedAt: new Date('2020-01-01'),
      lastInspectedAt: null,
    });
    const high = computeHealthScore({
      badgeTier: 'ELITE', inspectionScore: 9, employeeCount: 15,
      monthlyUsers: 5000, totalFundingRaised: 2000000, updatedAt: new Date(),
      lastInspectedAt: new Date(), reviewCount: 10, avgReviewRating: 4.5,
    });
    expect(high).toBeGreaterThan(low);
  });

  it('never exceeds 100 even with maxed-out inputs', () => {
    const score = computeHealthScore({
      badgeTier: 'ELITE', inspectionScore: 10, employeeCount: 999,
      monthlyUsers: 10000000, totalFundingRaised: 999999999, updatedAt: new Date(),
      lastInspectedAt: new Date(), reviewCount: 999, avgReviewRating: 5,
    });
    expect(score).toBeLessThanOrEqual(100);
  });
});
