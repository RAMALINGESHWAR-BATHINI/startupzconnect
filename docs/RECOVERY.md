# StartupzConnect — Recovery

## Incident Response
1. **Compromised account:** Revoke all sessions for the user via `admin/security` API or `revokeAllSessionsForUserExcept` to keep current session.
2. **Compromised admin:** Revoke their role assignments via `admin/grants` DELETE; audit the action.
3. **Suspicious activity:** Create a `SecurityIncident` record; review `AuditLog` for AUTHZ_FAILURE events.
4. **Last GLOBAL_ADMIN locked out:** Direct database insert of a `GLOBAL_ADMIN` `AdminRoleAssignment` row (bypasses app code).

## Data Recovery
- AuditLog and SiteSettingHistory are append-only (DB triggers refuse UPDATE/DELETE)
- Purging old audit rows: drop trigger → delete → recreate trigger (document approval)
- Rollback migration: restore D1 export / time travel

## Session Revocation
- `revokeSession(sessionId)` — revoke a single session
- `revokeAllSessionsForUser(userId)` — revoke all sessions (full lockout)
- `revokeAllSessionsForUserExcept(userId, keepSessionId)` — revoke all except current (rotate on compromise)

## Token Invalidation
- Password change: all sessions revoked, new session issued
- Refresh token reuse detected: all sessions for user revoked (possible theft)
- Logout-all: all sessions revoked + cookies cleared