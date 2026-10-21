# StartupzConnect — API Docs

## Auth Endpoints

### POST /api/auth/login
Body: `{ email, password, turnstileToken? }`
Rate limited per email + IP. Turnstile when configured. Creates a `Session` row on success.

### POST /api/auth/register
Body: `{ name, email, password, role, acceptTerms, turnstileToken?, profile? }`
Rate limited. Turnstile when configured. Password policy enforced. ADMIN role never accepted from client. Email verification required.

### POST /api/auth/refresh
Cookie: `refreshToken`. Verifies purpose, looks up Session by hash, rotates (revoke old + create new). Reuse detection revokes all sessions.

### POST /api/auth/logout-all
Revokes all `Session` rows for the user + clears cookies.

### PUT /api/auth/password
Body: `{ currentPassword, newPassword }`. Validates new password, revokes all sessions, issues new session.

### POST /api/auth/forgot-password
Rate limited + Turnstile. Generic response. Reset token invalidates prior sessions.

### POST /api/auth/reset-password
Body: `{ token, newPassword }`. Validates password, single-use token, revokes all sessions.

### GET /api/auth/me
Returns caller's profile + admin roles/permissions.

## Admin Endpoints (require `authorizeAdmin`)

### GET/POST /api/admin/roles
List roles / create custom role (GLOBAL_ADMIN + `admin.roles.assign`, sensitive).

### GET/POST/DELETE /api/admin/assignments
List / assign / revoke admin role assignments. Sensitive. Last GLOBAL_ADMIN protection.

### GET/POST/DELETE /api/admin/grants
List / create / revoke role grants. Sensitive roles create ApprovalRequest instead.

### GET/POST/DELETE /api/admin/permissions
Lookup user's effective permissions. Permissions are role-derived.

### POST /api/admin/approvals
Approve/reject an ApprovalRequest. No self-approval. Delegated approval notifies GLOBAL_ADMIN.

### GET /api/admin/audit-logs
Read-only audit log (redacted).

### GET /api/admin/security
Security incidents, session revocation, security events.

### GET /api/admin/data
Database health, record stats, export requests, retention.

### GET /api/admin/design
Site settings draft/publish/rollback.

### GET /api/admin/dev
Health, diagnostics, integrations.

### GET /api/admin/settings
Site settings.

## IDOR Fixes
- Team DELETE: verifies `member.startupId === startupId` before deletion
- Inspections GET: owner / agent / admin / verified investor with investment interest; safe agent fields only
- Inspections PATCH: atomic one-shot submission (conditional update on status); agents cannot self-approve; admin approve/reject only from SUBMITTED state