# StartupzConnect — Admin Roles & Permission Matrix

## Roles
| Role | Type | Description |
|------|------|-------------|
| GLOBAL_ADMIN | Primary | Platform administration: role assignment, approvals, review queues, audit oversight |
| DEV_ADMIN | Primary | Application health, diagnostics, integration status. No business data access |
| SEC_ADMIN | Primary | Security events, access reviews, session revocation, suspension, incident response |
| DATA_ADMIN | Primary | Database health, data quality, retention, export requests (exports need approval) |
| DESIGN_ADMIN | Primary | Branding, homepage content, navigation; draft/publish/rollback |
| CONTENT_EDITOR | Operational | Can edit draft site content; cannot publish |
| SECURITY_ANALYST | Operational | Read-only view of security events and audit logs |
| SUPPORT_OPERATOR | Operational | Inspection, document, content-report review queues |
| DATABASE_OPERATOR | Operational | Read-only database health and record statistics |
| AUDITOR_READONLY | Operational | Read-only view of audit logs and role assignments |

## Sensitive Roles
GLOBAL_ADMIN, SEC_ADMIN, DATA_ADMIN require independent approval by a different GLOBAL_ADMIN. No self-approval.

## Permission Matrix
| Permission | GLOBAL | DEV | SEC | DATA | DESIGN | CONTENT | SEC-ANALYST | SUPPORT | DATABASE | AUDITOR |
|------------|--------|-----|-----|------|--------|---------|-------------|---------|----------|---------|
| admin.dashboard.read | X | X | X | X | X | X | X | X | X | X |
| admin.users.read | X | | X | | | | | | | |
| admin.roles.read | X | | X | | | | | | | X |
| admin.roles.assign | X | | | | | | | | | |
| admin.approvals.read | X | | X | X | | | | | | |
| admin.approvals.review | X | | | | | | | | | |
| admin.settings.read | X | | | | | | | | | |
| audit.logs.read | X | | X | | | | X | | | X |
| security.events.read | X | | X | | | | X | | | |
| security.sessions.revoke | X | | X | | | | | | | |
| security.users.suspend | X | | X | | | | | | | |
| security.incidents.manage | X | | X | | | | | | | |
| data.database_health.read | X | | | X | | | | | X | |
| data.records.stats.read | X | | | X | | | | | X | |
| data.retention.read | X | | | X | | | | | X | |
| data.exports.request | X | | | X | | | | | | |
| data.exports.approve | X | | | | | | | | | |
| design.settings.read | X | | | | X | X | | | | |
| design.theme.update | X | | | | X | | | | | |
| design.content.edit | X | | | | X | X | | | | |
| design.content.publish | X | | | | X | | | | | |
| dev.health.read | X | X | | | | | | | | |
| dev.diagnostics.read | X | X | | | | | | | | |
| dev.integrations.read | X | X | | | | | | | | |
| inspections.reports.read | X | | | | | | | X | | |
| inspections.reports.review | X | | | | | | | X | | |
| documents.verify | X | | | | | | | X | | |
| reports.moderate | X | | | | | | | X | | |
| institutions.manage | X | | | | | | | | | |
| grants.manage | X | | | | | | | | | |
| users.notify | X | | | | | | | | | |
| investors.verification.review | X | | | | | | | | | |

## Deny by Default
Unknown roles and unknown permissions grant nothing. No inheritance between roles. REPORTS_TO (DATA_ADMIN → DEV_ADMIN) is informational only.