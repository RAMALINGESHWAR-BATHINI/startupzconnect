/**
 * Central permission registry — the single source of truth for what each
 * administrator role may do. Pure data + pure functions (no DB, no framework),
 * so it can be tested exhaustively and used to generate documentation.
 *
 * Rules enforced by construction:
 *  - Deny by default: unknown roles and unknown permissions grant nothing.
 *  - No inheritance. A role has exactly the permissions listed for it. The
 *    organizational reporting line (REPORTS_TO) is informational only and never
 *    confers permissions — DATA_ADMIN reporting to DEV_ADMIN gives DEV_ADMIN no data access.
 *  - Dangerous capabilities (assigning roles, approving exports) are held by exactly
 *    one role and additionally require independent approval + re-auth at the point of use.
 */
export const ADMIN_ROLES = ['GLOBAL_ADMIN', 'DEV_ADMIN', 'SEC_ADMIN', 'DATA_ADMIN', 'DESIGN_ADMIN'] as const;
export const OPERATIONAL_ROLES = ['CONTENT_EDITOR', 'SECURITY_ANALYST', 'SUPPORT_OPERATOR', 'DATABASE_OPERATOR', 'AUDITOR_READONLY'] as const;
export const ALL_ADMIN_ROLES = [...ADMIN_ROLES, ...OPERATIONAL_ROLES] as const;
export type AdminRole = (typeof ALL_ADMIN_ROLES)[number];

export const PERMISSIONS = [
  'admin.dashboard.read', 'admin.users.read', 'admin.roles.read', 'admin.roles.assign',
  'admin.approvals.read', 'admin.approvals.review', 'admin.settings.read',
  'audit.logs.read',
  'security.events.read', 'security.sessions.revoke', 'security.users.suspend', 'security.incidents.manage',
  'data.database_health.read', 'data.records.stats.read', 'data.retention.read', 'data.exports.request', 'data.exports.approve',
  'design.settings.read', 'design.theme.update', 'design.content.edit', 'design.content.publish',
  'dev.health.read', 'dev.diagnostics.read', 'dev.integrations.read',
  'inspections.reports.read', 'inspections.reports.review', 'documents.verify', 'reports.moderate',
  'institutions.manage', 'grants.manage', 'users.notify', 'investors.verification.review',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  GLOBAL_ADMIN: [
    'admin.dashboard.read', 'admin.users.read', 'admin.roles.read', 'admin.roles.assign',
    'admin.approvals.read', 'admin.approvals.review', 'admin.settings.read', 'audit.logs.read',
    'security.events.read', 'security.sessions.revoke', 'security.users.suspend',
    'data.database_health.read', 'data.records.stats.read', 'data.retention.read', 'data.exports.request', 'data.exports.approve',
    'design.settings.read', 'dev.health.read', 'dev.integrations.read',
    'inspections.reports.read', 'inspections.reports.review', 'documents.verify', 'reports.moderate',
    'institutions.manage', 'grants.manage', 'users.notify', 'investors.verification.review',
  ],
  DEV_ADMIN: ['admin.dashboard.read', 'dev.health.read', 'dev.diagnostics.read', 'dev.integrations.read'],
  SEC_ADMIN: [
    'admin.dashboard.read', 'admin.users.read', 'admin.roles.read', 'admin.approvals.read', 'audit.logs.read',
    'security.events.read', 'security.sessions.revoke', 'security.users.suspend', 'security.incidents.manage',
  ],
  DATA_ADMIN: [
    'admin.dashboard.read', 'admin.approvals.read',
    'data.database_health.read', 'data.records.stats.read', 'data.retention.read', 'data.exports.request',
  ],
  DESIGN_ADMIN: ['admin.dashboard.read', 'design.settings.read', 'design.theme.update', 'design.content.edit', 'design.content.publish'],
  CONTENT_EDITOR: ['admin.dashboard.read', 'design.settings.read', 'design.content.edit'],
  SECURITY_ANALYST: ['admin.dashboard.read', 'security.events.read', 'audit.logs.read'],
  SUPPORT_OPERATOR: ['admin.dashboard.read', 'inspections.reports.read', 'inspections.reports.review', 'documents.verify', 'reports.moderate'],
  DATABASE_OPERATOR: ['admin.dashboard.read', 'data.database_health.read', 'data.records.stats.read', 'data.retention.read'],
  AUDITOR_READONLY: ['admin.dashboard.read', 'admin.roles.read', 'audit.logs.read'],
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  GLOBAL_ADMIN: 'Platform administration: role assignment, approvals, review queues, audit oversight.',
  DEV_ADMIN: 'Application health, diagnostics and integration status. No access to business data.',
  SEC_ADMIN: 'Security events, access reviews, session revocation, suspension and incident response. No access to business data.',
  DATA_ADMIN: 'Database health, data quality, retention status and export requests. Exports need independent approval.',
  DESIGN_ADMIN: 'Branding, homepage content and navigation, with draft, publish and rollback.',
  CONTENT_EDITOR: 'Can edit draft site content; cannot publish.',
  SECURITY_ANALYST: 'Read-only view of security events and audit logs.',
  SUPPORT_OPERATOR: 'Works the inspection, document and content-report review queues.',
  DATABASE_OPERATOR: 'Read-only database health and record statistics.',
  AUDITOR_READONLY: 'Read-only view of audit logs and role assignments.',
};

/** Organizational reporting line. Informational only — grants no permissions. */
export const REPORTS_TO: Partial<Record<AdminRole, AdminRole>> = { DATA_ADMIN: 'DEV_ADMIN' };

/** Assigning these roles needs independent approval by a different GLOBAL_ADMIN. */
export const SENSITIVE_ROLES: readonly AdminRole[] = ['GLOBAL_ADMIN', 'SEC_ADMIN', 'DATA_ADMIN'];

export function isAdminRole(v: unknown): v is AdminRole {
  return typeof v === 'string' && (ALL_ADMIN_ROLES as readonly string[]).includes(v);
}
export function isPermission(v: unknown): v is Permission {
  return typeof v === 'string' && (PERMISSIONS as readonly string[]).includes(v);
}

/** Union of permissions for the given roles. Unknown role strings are ignored (deny by default). */
export function permissionsFor(roles: readonly unknown[]): Set<Permission> {
  const out = new Set<Permission>();
  for (const r of roles) if (isAdminRole(r)) for (const p of ROLE_PERMISSIONS[r]) out.add(p);
  return out;
}
export function hasPermission(perms: ReadonlySet<Permission>, p: unknown): boolean {
  return isPermission(p) && perms.has(p);
}
export function hasAnyPermission(perms: ReadonlySet<Permission>, list: readonly Permission[]): boolean {
  return list.some(p => perms.has(p));
}
export function roleRequiresApproval(role: AdminRole): boolean {
  return SENSITIVE_ROLES.includes(role);
}

/**
 * Containment boundary: an actor may suspend / revoke sessions of a target only if the
 * target is not a GLOBAL_ADMIN, unless the actor is one too. SEC_ADMIN can contain a
 * compromised DEV/DATA/DESIGN admin without being able to lock out the top administrators.
 */
export function canActOnTarget(actorRoles: readonly unknown[], targetRoles: readonly unknown[]): boolean {
  if (!targetRoles.includes('GLOBAL_ADMIN')) return true;
  return actorRoles.includes('GLOBAL_ADMIN');
}
