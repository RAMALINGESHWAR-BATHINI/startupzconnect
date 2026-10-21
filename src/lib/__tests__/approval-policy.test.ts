import { describe, it, expect } from 'vitest';
import { canDecide, APPROVAL_TYPES, isApprovalType, type Actor } from '@/lib/approval-policy';
import type { Permission } from '@/lib/permissions';

const future = new Date(Date.now() + 1000 * 60 * 60 * 24);

const actor = (id: number, ...permissions: Permission[]): Actor => ({
  id,
  permissions: new Set<Permission>(permissions),
});

/** Narrow a Verdict to its rejection branch so `reason` is readable. */
function expectRejection(result: { ok: true } | { ok: false; reason: string; status: number }) {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('expected the request to be rejected');
  return result;
}

describe('approval policy', () => {
  it('defines approval types with request/review permissions', () => {
    expect(isApprovalType('ROLE_ASSIGNMENT')).toBe(true);
    expect(isApprovalType('DATA_EXPORT')).toBe(true);
    expect(isApprovalType('INVALID_TYPE')).toBe(false);
  });

  it('rejects self-decision', () => {
    const req = { type: 'ROLE_ASSIGNMENT', status: 'PENDING', requestedById: 1, expiresAt: future } as any;
    const result = expectRejection(canDecide(req, actor(1, 'admin.roles.assign')));
    expect(result.reason).toContain('own');
  });

  it('rejects decision on non-pending request', () => {
    const req = { type: 'ROLE_ASSIGNMENT', status: 'APPROVED', requestedById: 2, expiresAt: future } as any;
    const result = expectRejection(canDecide(req, actor(1, 'admin.roles.assign')));
    expect(result.reason).toContain('decided');
  });

  it('allows authorized decider on pending request', () => {
    const req = { type: 'ROLE_ASSIGNMENT', status: 'PENDING', requestedById: 2, expiresAt: future } as any;
    const result = canDecide(req, actor(1, 'admin.roles.assign'));
    expect(result.ok).toBe(true);
  });

  it('denies decider without required permission', () => {
    const req = { type: 'DATA_EXPORT', status: 'PENDING', requestedById: 2, expiresAt: future } as any;
    const result = expectRejection(canDecide(req, actor(1, 'admin.roles.assign')));
    expect(result.reason).toContain('not permitted');
  });

  it('TTL hours are positive', () => {
    for (const [type, cfg] of Object.entries(APPROVAL_TYPES)) {
      expect(cfg.ttlHours).toBeGreaterThan(0);
    }
  });
});
