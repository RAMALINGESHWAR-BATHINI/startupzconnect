import { describe, it, expect } from 'vitest';
import { canDecide, APPROVAL_TYPES, isApprovalType } from '@/lib/approval-policy';

const future = new Date(Date.now() + 1000 * 60 * 60 * 24);

describe('approval policy', () => {
  it('defines approval types with request/review permissions', () => {
    expect(isApprovalType('ROLE_ASSIGNMENT')).toBe(true);
    expect(isApprovalType('DATA_EXPORT')).toBe(true);
    expect(isApprovalType('INVALID_TYPE')).toBe(false);
  });

  it('rejects self-decision', () => {
    const req = { type: 'ROLE_ASSIGNMENT', status: 'PENDING', requestedById: 1, expiresAt: future } as any;
    const decider = { id: 1, permissions: new Set(['admin.roles.assign']) };
    const result = canDecide(req, decider);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('own');
  });

  it('rejects decision on non-pending request', () => {
    const req = { type: 'ROLE_ASSIGNMENT', status: 'APPROVED', requestedById: 2, expiresAt: future } as any;
    const decider = { id: 1, permissions: new Set(['admin.roles.assign']) };
    const result = canDecide(req, decider);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('decided');
  });

  it('allows authorized decider on pending request', () => {
    const req = { type: 'ROLE_ASSIGNMENT', status: 'PENDING', requestedById: 2, expiresAt: future } as any;
    const decider = { id: 1, permissions: new Set(['admin.roles.assign']) };
    const result = canDecide(req, decider);
    expect(result.ok).toBe(true);
  });

  it('denies decider without required permission', () => {
    const req = { type: 'DATA_EXPORT', status: 'PENDING', requestedById: 2, expiresAt: future } as any;
    const decider = { id: 1, permissions: new Set(['admin.roles.assign']) };
    const result = canDecide(req, decider);
    expect(result.ok).toBe(false);
  });

  it('TTL hours are positive', () => {
    for (const [type, cfg] of Object.entries(APPROVAL_TYPES)) {
      expect(cfg.ttlHours).toBeGreaterThan(0);
    }
  });
});
