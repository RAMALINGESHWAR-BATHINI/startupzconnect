# StartupzConnect — Migrations

## 0003_admin_system.sql
Incremental migration. Safe to apply on top of existing data.

### What it does
1. Adds columns to `User`: `status`, `investorVerificationStatus`, `investorReviewedBy`, `investorReviewedAt`, `investorReviewNotes`, `organization`
2. Adds column to `Startup`: `registrationIdType`
3. Creates new tables: `AdminRoleAssignment`, `AuditLog`, `ApprovalRequest`, `SecurityIncident`, `SiteSetting`, `SiteSettingHistory`, `Session`, `RateLimit`
4. Converts legacy admins (`User.role = 'ADMIN'`) into `GLOBAL_ADMIN` assignments
5. Maps old `investorVerified` boolean to `investorVerificationStatus`
6. Adds append-only triggers on `AuditLog` and `SiteSettingHistory`

### What it does NOT do
- Does not drop, rename, or rewrite any existing table or column
- Does not change `User.role` (legacy admins keep `role='ADMIN'` for rollback compatibility)
- Does not touch any other data

### Prerequisites
- `User` must already have: `id`, `role`, `investorVerified`, `investorNetWorth`
- `User` must NOT already have: `status`, `investorVerificationStatus`, `investorReviewedBy`, `investorReviewedAt`, `investorReviewNotes`, `organization`
- `Startup` must NOT already have: `registrationIdType`

### Application
1. Export production D1: `wrangler d1 export <DB> --remote --output backup-<date>.sql`
2. Apply to staging first; verify triggers refuse AuditLog UPDATE/DELETE
3. Apply to production only with explicit user approval
4. Deploy code after migration

### Rollback
Restore D1 export / time travel. New columns/tables are harmless to old code. `User.role` is untouched.

## Follow-up Migration (planned, not in 0003)
Drop `User.refreshToken` column (replaced by `Session.tokenHash`) — apply only after all auth flows are migrated to the `Session` table and verified.