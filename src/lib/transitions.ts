/** Allowed state transitions for workflows that must not be skippable or repeatable. */
export const INCIDENT_TRANSITIONS: Record<string, readonly string[]> = {
  OPEN: ['CONTAINED', 'RESOLVED'],
  CONTAINED: ['OPEN', 'RESOLVED'],
  RESOLVED: [],
};
export const INCIDENT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export function canTransition(map: Record<string, readonly string[]>, from: string, to: string): boolean {
  return Object.prototype.hasOwnProperty.call(map, from) && map[from].includes(to);
}

export type InvestorDecision = 'VERIFY' | 'REJECT' | 'REVOKE' | 'REOPEN';
/** Admin decisions on investor verification. Returns the new status, or null if the move is not allowed. */
export function investorDecisionTarget(decision: unknown, from: string): string | null {
  switch (decision) {
    case 'VERIFY': return from === 'PENDING' ? 'VERIFIED' : null;
    case 'REJECT': return from === 'PENDING' ? 'REJECTED' : null;
    case 'REVOKE': return from === 'VERIFIED' ? 'REVOKED' : null;
    case 'REOPEN': return from === 'REVOKED' ? 'PENDING' : null;
    default: return null;
  }
}

/**
 * What happens to verification status when an investor saves their own profile.
 * Material changes to verified facts reset verification; a revoked investor cannot
 * resubmit themselves back into review (an admin must REOPEN).
 */
export function investorStatusAfterSubmit(current: string, materialChange: boolean): string {
  if (current === 'NONE' || current === 'REJECTED') return 'PENDING';
  if (current === 'VERIFIED' && materialChange) return 'PENDING';
  return current;
}

/** An admin may only review an inspection that an agent has actually submitted. */
export const INSPECTION_ADMIN_REVIEWABLE = ['SUBMITTED'] as const;
