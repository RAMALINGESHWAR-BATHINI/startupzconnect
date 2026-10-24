/**
 * Pure policy for organization profile-claim workflow.
 * DB writes must use conditional updates for concurrency safety.
 */
export type ClaimStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFORMATION';

export const CLAIM_STATUSES: ClaimStatus[] = ['PENDING','UNDER_REVIEW','APPROVED','REJECTED','NEEDS_MORE_INFORMATION'];

export const ACTIVE_CLAIM_STATUSES: ClaimStatus[] = ['PENDING','UNDER_REVIEW','NEEDS_MORE_INFORMATION'];

export function isActiveClaim(status: string): boolean {
  return ACTIVE_CLAIM_STATUSES.includes(status as ClaimStatus);
}

export function canTransition(from: string, to: ClaimStatus): boolean {
  if (from === to) return false;
  if (from === 'APPROVED') return false; // approved claims are terminal
  if (to === 'PENDING') return false; // cannot reopen to pending
  return true;
}

export function canReview(status: string): boolean {
  return status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'NEEDS_MORE_INFORMATION';
}

export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_EVIDENCE_MIME = ['application/pdf','image/png','image/jpeg'] as const;
