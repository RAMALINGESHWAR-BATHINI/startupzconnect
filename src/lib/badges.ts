/** Field Verified and above badges expire 18 months after the last inspection (policy §4.6). */
const BADGE_EXPIRY_MONTHS = 18;

export function isBadgeExpired(lastInspectedAt: Date | string | null): boolean {
  if (!lastInspectedAt) return false; // never inspected — nothing to expire
  const inspected = new Date(lastInspectedAt);
  const expiry = new Date(inspected);
  expiry.setMonth(expiry.getMonth() + BADGE_EXPIRY_MONTHS);
  return expiry < new Date();
}

/** Returns the badge tier to actually display, downgrading an expired badge to REGISTERED. */
export function displayBadgeTier(badgeTier: string, lastInspectedAt: Date | string | null): string {
  if ((badgeTier === 'FIELD_VERIFIED' || badgeTier === 'TRUSTED' || badgeTier === 'ELITE') && isBadgeExpired(lastInspectedAt)) {
    return 'REGISTERED';
  }
  return badgeTier;
}

/** A rough, transparent 0-100 health score from the pieces we already track. */
export function computeHealthScore(startup: {
  badgeTier: string; inspectionScore: number | null; employeeCount: number;
  monthlyUsers: number | null; totalFundingRaised: number | null;
  updatedAt: Date | string; reviewCount?: number; avgReviewRating?: number | null;
  lastInspectedAt: Date | string | null;
}): number {
  let score = 0;

  // Verification (0-30)
  const tierPoints: Record<string, number> = { NONE: 0, REGISTERED: 10, FIELD_VERIFIED: 22, TRUSTED: 27, ELITE: 30 };
  const effectiveTier = displayBadgeTier(startup.badgeTier, startup.lastInspectedAt);
  score += tierPoints[effectiveTier] ?? 0;

  // Inspection quality (0-15)
  if (startup.inspectionScore) score += (startup.inspectionScore / 10) * 15;

  // Team size (0-10) — capped, more isn't always better at this stage
  score += Math.min(10, startup.employeeCount * 1.5);

  // Traction (0-20)
  if (startup.monthlyUsers) score += Math.min(10, Math.log10(startup.monthlyUsers + 1) * 3);
  if (startup.totalFundingRaised) score += Math.min(10, Math.log10(startup.totalFundingRaised + 1) * 1.2);

  // Community reviews (0-15)
  if (startup.reviewCount && startup.avgReviewRating) {
    score += Math.min(10, startup.reviewCount) + (startup.avgReviewRating / 5) * 5;
  }

  // Activity recency (0-10) — profile updated in the last 30 days
  const daysSinceUpdate = (Date.now() - new Date(startup.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  score += daysSinceUpdate < 30 ? 10 : daysSinceUpdate < 90 ? 5 : 0;

  return Math.round(Math.min(100, score));
}
