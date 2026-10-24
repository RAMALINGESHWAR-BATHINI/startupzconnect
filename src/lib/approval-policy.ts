/**
 * Pure policy for the approval workflow. The database layer calls these to decide;
 * the DB writes themselves must use conditional updates (status must still be PENDING /
 * APPROVED) so a decision or execution can happen only once, even under concurrency.
 */
import { isAdminRole, type AdminRole, type Permission } from './permissions';

export type ApprovalType = 'ROLE_ASSIGNMENT' | 'DATA_EXPORT' | 'OWNERSHIP_TRANSFER';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'EXECUTION_FAILED' | 'EXPIRED';

export const APPROVAL_TYPES: Record<ApprovalType, { requestPermission: Permission; reviewPermission: Permission; ttlHours: number }> = {
  ROLE_ASSIGNMENT: { requestPermission: 'admin.roles.assign', reviewPermission: 'admin.roles.assign', ttlHours: 72 },
  DATA_EXPORT: { requestPermission: 'data.exports.request', reviewPermission: 'data.exports.approve', ttlHours: 24 },
  OWNERSHIP_TRANSFER: { requestPermission: 'admin.roles.assign', reviewPermission: 'admin.roles.assign', ttlHours: 72 },
};
export const EXPORT_EXECUTION_WINDOW_HOURS = 24;
export const EXPORT_DATASETS = ['startups', 'users_basic'] as const;
export type ExportDataset = (typeof EXPORT_DATASETS)[number];

export interface ApprovalLike { type: string; status: string; requestedById: number; expiresAt: Date; decidedAt?: Date | null }
export interface Actor { id: number; permissions: ReadonlySet<Permission> }
export type Verdict = { ok: true } | { ok: false; reason: string; status: number };

export function isApprovalType(v: unknown): v is ApprovalType {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(APPROVAL_TYPES, v);
}
export function expiresAtFor(type: ApprovalType, now = new Date()): Date {
  return new Date(now.getTime() + APPROVAL_TYPES[type].ttlHours * 3600 * 1000);
}

/** May `approver` approve/reject this request right now? Independent review is mandatory. */
export function canDecide(req: ApprovalLike, approver: Actor, now = new Date()): Verdict {
  if (!isApprovalType(req.type)) return { ok: false, reason: 'Unknown approval type.', status: 400 };
  if (req.status !== 'PENDING') return { ok: false, reason: 'This request has already been decided.', status: 409 };
  if (req.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: 'This request has expired.', status: 410 };
  if (approver.id === req.requestedById) return { ok: false, reason: 'You cannot approve your own request.', status: 403 };
  if (!approver.permissions.has(APPROVAL_TYPES[req.type].reviewPermission)) {
    return { ok: false, reason: 'You are not permitted to review this type of request.', status: 403 };
  }
  return { ok: true };
}

/** May `executor` download an approved export now? Requester only, once, within the window. */
export function canExecuteExport(req: ApprovalLike, executor: Actor, now = new Date()): Verdict {
  if (req.type !== 'DATA_EXPORT') return { ok: false, reason: 'Not an export request.', status: 400 };
  if (req.status !== 'APPROVED') return { ok: false, reason: 'This export is not approved, or was already downloaded.', status: 409 };
  if (executor.id !== req.requestedById) return { ok: false, reason: 'Only the requester can download this export.', status: 403 };
  if (!executor.permissions.has(APPROVAL_TYPES.DATA_EXPORT.requestPermission)) {
    return { ok: false, reason: 'Your role no longer permits data exports.', status: 403 };
  }
  const decidedAt = req.decidedAt ?? req.expiresAt;
  if (now.getTime() > decidedAt.getTime() + EXPORT_EXECUTION_WINDOW_HOURS * 3600 * 1000) {
    return { ok: false, reason: 'The download window for this export has closed.', status: 410 };
  }
  return { ok: true };
}

export function parseRoleAssignmentPayload(p: unknown): { ok: true; targetUserId: number; role: AdminRole } | { ok: false; error: string } {
  const o = p as any;
  if (!o || typeof o !== 'object') return { ok: false, error: 'Invalid payload.' };
  if (!Number.isInteger(o.targetUserId) || o.targetUserId < 1) return { ok: false, error: 'A valid target user is required.' };
  if (!isAdminRole(o.role)) return { ok: false, error: 'Unknown role.' };
  return { ok: true, targetUserId: o.targetUserId, role: o.role };
}
export function parseExportPayload(p: unknown): { ok: true; dataset: ExportDataset } | { ok: false; error: string } {
  const o = p as any;
  if (!o || typeof o !== 'object' || !(EXPORT_DATASETS as readonly string[]).includes(o.dataset)) {
    return { ok: false, error: `Dataset must be one of: ${EXPORT_DATASETS.join(', ')}.` };
  }
  return { ok: true, dataset: o.dataset };
}
export function validateReason(reason: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof reason !== 'string') return { ok: false, error: 'A reason is required.' };
  const v = reason.trim();
  if (v.length < 10 || v.length > 500) return { ok: false, error: 'Reason must be 10 to 500 characters.' };
  return { ok: true, value: v };
}
