-- 0003_admin_system.sql  —  INCREMENTAL. Safe to review line by line.
--
-- What this does:
--   * adds columns to "User" and "Startup"            (ALTER TABLE ... ADD COLUMN)
--   * creates new tables for the admin system          (CREATE TABLE IF NOT EXISTS)
--   * converts existing legacy admins (User.role = 'ADMIN') into GLOBAL_ADMIN assignments
--   * makes "AuditLog" and "SiteSettingHistory" append-only with triggers
--
-- What this deliberately does NOT do:
--   * drop, rename or rewrite any existing table or column  (the baseline "Suggestion" table, if present, is untouched)
--   * change User.role. Legacy admins keep role='ADMIN' so rolling the application back stays possible.
--     New code ignores that string entirely (deny by default); clean it up in a later migration once the rollout is verified.
--   * touch any other data.
--
-- PREREQUISITES — verify on your database BEFORE applying (see docs/MIGRATIONS.md):
--   "User" must already have: id, role, investorVerified, investorNetWorth.
--   "User" must NOT already have: status, investorVerificationStatus, investorReviewedBy, investorReviewedAt, investorReviewNotes, organization.
--   "Startup" must NOT already have: registrationIdType.
-- A column that already exists makes the ALTER fail, and the whole migration must then be rolled back / not applied.
-- Apply to a copy (staging) first. Take an export first:  wrangler d1 export <db> --remote --output backup.sql

-- ── existing tables: new columns ───────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "investorVerificationStatus" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "User" ADD COLUMN "investorReviewedBy" INTEGER;
ALTER TABLE "User" ADD COLUMN "investorReviewedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "investorReviewNotes" TEXT;
ALTER TABLE "User" ADD COLUMN "organization" TEXT;
ALTER TABLE "Startup" ADD COLUMN "registrationIdType" TEXT;

-- ── new tables ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AdminRoleAssignment" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "role" TEXT NOT NULL,
  "grantedById" INTEGER,
  "approvalId" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminRoleAssignment_userId_role_key" ON "AdminRoleAssignment"("userId", "role");
CREATE INDEX IF NOT EXISTS "AdminRoleAssignment_userId_idx" ON "AdminRoleAssignment"("userId");

-- No foreign key on actorId on purpose: audit records must outlive the accounts they describe.
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "category" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'INFO',
  "outcome" TEXT NOT NULL DEFAULT 'SUCCESS',
  "actorId" INTEGER,
  "actorLabel" TEXT,
  "targetType" TEXT,
  "targetId" TEXT,
  "ip" TEXT,
  "metadata" TEXT
);
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_category_createdAt_idx" ON "AuditLog"("category", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");

CREATE TABLE IF NOT EXISTS "ApprovalRequest" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "requestedById" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "decidedById" INTEGER,
  "decidedAt" DATETIME,
  "decisionNote" TEXT,
  "executedAt" DATETIME,
  "executionOutcome" TEXT,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");
CREATE INDEX IF NOT EXISTS "ApprovalRequest_requestedById_idx" ON "ApprovalRequest"("requestedById");

CREATE TABLE IF NOT EXISTS "SecurityIncident" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdById" INTEGER NOT NULL,
  "resolutionNote" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" DATETIME
);
CREATE INDEX IF NOT EXISTS "SecurityIncident_status_idx" ON "SecurityIncident"("status");

CREATE TABLE IF NOT EXISTS "SiteSetting" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "draft" TEXT NOT NULL DEFAULT '{}',
  "published" TEXT,
  "version" INTEGER NOT NULL DEFAULT 0,
  "updatedBy" INTEGER,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" DATETIME
);
CREATE TABLE IF NOT EXISTS "SiteSettingHistory" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "key" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "value" TEXT NOT NULL,
  "publishedBy" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "SiteSettingHistory_key_version_key" ON "SiteSettingHistory"("key", "version");

-- Fixed-window rate limiter (also created by the security pass; IF NOT EXISTS makes this a no-op if it is already there).
CREATE TABLE IF NOT EXISTS "RateLimit" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 0,
  "windowStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "RateLimit_windowStart_idx" ON "RateLimit"("windowStart");

-- ── data: legacy admins become GLOBAL_ADMIN (idempotent; role column left as-is) ──
INSERT OR IGNORE INTO "AdminRoleAssignment" ("userId", "role", "grantedById")
  SELECT "id", 'GLOBAL_ADMIN', NULL FROM "User" WHERE "role" = 'ADMIN';

-- ── data: investor verification status from the old boolean ──
UPDATE "User" SET "investorVerificationStatus" = 'VERIFIED' WHERE "investorVerified" = 1;
UPDATE "User" SET "investorVerificationStatus" = 'PENDING'
  WHERE "investorVerified" = 0 AND "investorNetWorth" IS NOT NULL AND "investorVerificationStatus" = 'NONE';

-- ── append-only protection ──
-- The application never updates or deletes these rows, and these triggers make the database refuse it too.
-- Purging old audit rows is a deliberate DBA operation: drop the trigger, delete, recreate — document who approved it.
CREATE TRIGGER IF NOT EXISTS "AuditLog_no_update" BEFORE UPDATE ON "AuditLog"
BEGIN SELECT RAISE(ABORT, 'AuditLog is append-only'); END;
CREATE TRIGGER IF NOT EXISTS "AuditLog_no_delete" BEFORE DELETE ON "AuditLog"
BEGIN SELECT RAISE(ABORT, 'AuditLog is append-only'); END;
CREATE TRIGGER IF NOT EXISTS "SiteSettingHistory_no_update" BEFORE UPDATE ON "SiteSettingHistory"
BEGIN SELECT RAISE(ABORT, 'SiteSettingHistory is append-only'); END;
CREATE TRIGGER IF NOT EXISTS "SiteSettingHistory_no_delete" BEFORE DELETE ON "SiteSettingHistory"
BEGIN SELECT RAISE(ABORT, 'SiteSettingHistory is append-only'); END;
