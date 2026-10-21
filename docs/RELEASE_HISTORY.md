# StartupzConnect — Release History

Chronological record of every preserved release. For the narrative behind each release see
[`EVOLUTION.md`](EVOLUTION.md).

---

## v6.0.0 — Consolidated release

**Branch:** `master` · **Tag:** `v6.0.0`

The consolidation release. Based on v5.1 with the consent flow, UI fixes and repository hardening layered on.

### Added
- `src/lib/legal-consent.ts` — visit-gated legal-consent tracking (`markLegalDocRead`, `getLegalDocsRead`,
  `clearLegalDocsRead`, `LegalDoc`).
- `src/components/LegalReadTracker.tsx` — records Terms / Privacy page visits.
- `scripts/verify-consent.mjs` — four assertions pinning the consent contract.
- `scripts/security-check.mjs` — restored from v5.1 (static security assertions over the source tree).
- `docs/` — restored from v5.1: `ADMIN-ROLES`, `API-DOCS`, `ARCHITECTURE`, `DEPLOYMENT`, `ENV-VARS`,
  `MIGRATIONS`, `RECOVERY`, `SECURITY-POLICIES`, `TESTING`.
- `docs/EVOLUTION.md`, `docs/RELEASE_HISTORY.md`, `docs/SECURITY.md`.

### Changed
- `src/app/register/RegisterClient.tsx` — registration progression fixed; the consent gate and the agreement
  validation wired in.
- `src/context/AuthContext.tsx` — `register()` now accepts `acceptTerms` and an optional `profile` payload.
- `src/app/terms/page.tsx`, `src/app/privacy/page.tsx` — mount `LegalReadTracker`.
- `src/components/Navbar.tsx`, `src/components/Footer.tsx` — branding rebuilt.
- `src/app/page.tsx` — homepage favicon replaced.
- `src/app/startups/StartupsClient.tsx`, `src/app/jobs/JobsClient.tsx`,
  `src/app/cofounders/CofoundersClient.tsx` — filtering improved.
- 11 admin pages under `src/app/admin/` — `'use client'` added.
- `.gitignore` — rewritten to exclude `.env*` (keeping `.env.example`), all SQLite artefacts, build output,
  Cloudflare state and runtime uploads.
- `.env.example` — rewritten so every value is a placeholder; `R2_PUBLIC_BUCKET_NAME` /
  `R2_PRIVATE_BUCKET_NAME` named correctly and `TURNSTILE_SECRET_KEY` added.
- `README.md` — replaced the default create-next-app template with full project documentation.

### Fixed
- **The build recursed infinitely.** `build` was `npx prisma generate && opennextjs-cloudflare build`, and
  OpenNext invokes `npm run build` internally — so every build restarted itself. Split into
  `build` (`prisma generate && next build`) and `build:worker` (the OpenNext bundle).
- **All 22 TypeScript errors, which failed the build.** Next.js type-checks during `next build`, so these
  were not cosmetic:
  - 9 × `isEmailVerified(decoded.id, decoded.role)` — the guard takes one argument since the legacy ADMIN
    exemption was removed. The vestigial second argument was dropped.
  - `admin/permissions` — dead code reading `new URL(...).searchEntries` (not a `URL` API) was removed.
  - `startups/[id]/reviews` — `isAnonymous` was being selected from `User`; it belongs on the review itself.
    The author's name is now read from the database instead of the (empty) token payload.
  - `startups/[id]/documents/[docId]/resolve` — `email` was missing from the `select` but used as the audit
    label.
  - `dashboard/startups/create` — a `filter(Boolean)` over a `(string | null)[][]` is now a typed type guard.
  - `approval-policy.test.ts` — `Set<string>` was not a `ReadonlySet<Permission>`, and the `Verdict` union
    did not narrow to its rejection branch.
- **`decoded.role` was always `undefined`.** `issueAuthSession()` signed the access token with `{ id }` only,
  while ~25 route handlers authorised on `decoded.role`. Those checks could never pass. The token now carries
  `{ id, email, role }`, matching the refresh route.
- **`@aws-sdk/s3-request-presigner` was imported but not declared.** Added to `package.json`.
- **`useSearchParams()` broke prerendering.** `/reset-password` and `/verify-email` are now wrapped in a
  `Suspense` boundary.
- **`scripts/security-check.mjs`** — now verifies that no environment or database file is *tracked by git*
  rather than merely present, and reports legacy role-trust call sites as advisories instead of silently
  passing.
- New npm scripts: `build:worker`, `typecheck`, `security:check`, `verify:consent`.

### Removed
- `prisma/dev.db` — removed from every commit in the repository. It contained user rows, bcrypt password
  hashes and live refresh tokens. See [`SECURITY.md`](SECURITY.md).

---

## v5.1.0 — Admin foundation merged, sessions restored

**Branch:** `archive/v5.1` · **Tag:** `v5.1.0`

### Added
- `src/lib/sessions.ts` — multi-device session management with bcrypt-hashed refresh tokens, per-session
  revocation and "log out everywhere".
- `src/lib/admin-auth.ts` — `authorizeAdmin()`: CSRF validation + token verification + live role/permission
  check against the database.
- `src/lib/permissions.ts` — the single source of truth for the role → permission matrix.
- `src/lib/approval-policy.ts`, `src/lib/csrf-core.ts`, `src/lib/password-policy.ts`,
  `src/lib/registration-rules.ts`, `src/lib/site-settings-schema.ts`, `src/lib/transitions.ts`,
  `src/lib/redact.ts`, `src/lib/url-safety.ts`, `src/lib/turnstile.ts` — merged in from the
  admin-foundation branch.
- `Session`, `RateLimit`, `AdminRoleAssignment`, `AuditLog`, `ApprovalRequest`, `SecurityIncident`,
  `SiteSetting`, `SiteSettingHistory` models.

---

## v5.1.0-foundation — Admin & security library (side branch)

**Branch:** `archive/admin-foundation` · **Tag:** `v5.1.0-foundation`

The admin system extracted as a standalone, independently testable package: ten library modules, nine Vitest
suites, the `0003_admin_system` migration and five supporting documents.

---

## v5.0.0 — Cloudflare R2 storage and error alerting

**Branch:** `archive/v5` · **Tag:** `v5.0.0`

### Added
- `src/lib/storage.ts` — R2 public and private buckets, upload validation, 5-minute signed URLs for
  sensitive objects, local `/public/uploads` fallback for development.
- `src/lib/alerts.ts` — optional Slack webhook error alerting.

---

## v5.0.0-fixed — Security hardening (side branch)

**Branch:** `archive/fixed` · **Tag:** `v5.0.0-fixed`

### Added
- `src/lib/turnstile.ts` — Cloudflare Turnstile verification, fail-closed once configured.
- `src/lib/url-safety.ts` — URL safety validation.

---

## v4.0.0 — Multi-vertical platform

**Branch:** `archive/v4` · **Tag:** `v4.0.0`

### Added
- Five verticals: co-founders, events, press, grants, mentors.
- `vitest.config.ts` and the first Vitest suites over the shared libraries.
- `src/lib/badges.ts`, `src/lib/file-signature.ts` — badge rules and magic-byte file verification.

---

## v3.0.0 — E-mail delivery

**Branch:** `archive/v3` · **Tag:** `v3.0.0`

### Added
- `src/lib/mailer.ts` — Resend integration with a console fallback when no API key is configured.

---

## v2.0.0 — Administration and the field-agent portal

**Branch:** `archive/v2` · **Tag:** `v2.0.0`

### Added
- `/admin` dashboard and the `/api/admin/*` route family.
- `/agent` field-inspection portal and the `/api/agent/*` route family.
- `SETUP.md` — local and production setup guide.
- `prisma/0003_admin_system.sql` — incremental admin-system migration.

---

## v1.0.0 — The Next.js rewrite

**Branch:** `archive/v1` · **Tag:** `v1.0.0` · 2026-05-16

The seven original commits, preserved with their original authorship, dates and messages:

| Commit | Date | Message |
|--------|------|---------|
| `8f897cd` | 2026-05-16 20:47 | Initial commit — unified full-stack architecture |
| `5980ef9` | 2026-05-16 21:32 | Fix deployment: sync project name and add OpenNext config |
| `a9ff82d` | 2026-05-16 22:26 | Add public environment variables to Cloudflare config |
| `0e496a1` | 2026-05-16 22:30 | Configure Prisma with Cloudflare D1 adapter |
| `05d4531` | 2026-05-16 22:50 | Fix build command for Cloudflare OpenNext |
| `6acc018` | 2026-05-16 22:59 | Fix OpenNext config format for new cloudflare adapter version |
| `ac568c8` | 2026-05-16 23:11 | Fix OpenNext config syntax to use direct default export |

> These SHAs differ from the originals on GitHub **only** because `prisma/dev.db` was removed from every
> commit. The tree, author, date and message are otherwise byte-identical.

---

## v0.0.0 — Java/JSP prototype

**Branch:** `archive/v0` · **Tag:** `v0.0.0`

The original StartupzConnect: JSP pages, servlets, CSS and JavaScript, with a raw SQL schema covering
startups, collaboration requests, hiring, events and role dashboards.
