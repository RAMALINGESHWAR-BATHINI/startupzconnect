# StartupzConnect — Evolution

How the platform grew from a Java/JSP prototype into a hardened Next.js platform, and what each release
actually changed.

---

## v0 — the original prototype

`archive/v0` · tag `v0.0.0`

The earliest incarnation of StartupzConnect was a classic multi-page Java application:

```
index.jsp  login.jsp  register.jsp  unauthorized.jsp
collaboration/  dashboards/  events/  hiring/  profile/
src/com/startupconnect/…   (servlets)
database/schema.sql
```

It already contained the product DNA that survives to this day — role dashboards for founder, contributor,
investor and admin; a hiring module; a collaboration-request workflow; and an events module. What it lacked
was any type safety, any test suite, and any deployment story. This version is preserved unchanged as the
historical baseline.

---

## v1 — the Next.js rewrite

`archive/v1` · tag `v1.0.0` · 2026-05-16

The rewrite to Next.js 16 (App Router) with React 19, TypeScript and Prisma. This release introduced the
architecture everything since has followed:

- App Router with route handlers under `src/app/api/*`.
- JWT authentication with HS256 access and refresh tokens, bcrypt password hashing, httpOnly cookies.
- Core verticals: startups, jobs and investment interests.
- Prisma schema with 7 models (`User`, `Startup`, `JobOpening`, `JobApplication`,
  `CollaborationRequest`, `Suggestion`, `InvestmentInterest`).
- Cloudflare deployment wiring: `wrangler.jsonc`, `open-next.config.ts`, and the D1 adapter configuration.

The seven original commits are preserved verbatim in the consolidated history — author, date and message are
unchanged — with one deliberate exception: `prisma/dev.db` was removed from every one of them. See
[`SECURITY.md`](SECURITY.md).

---

## v2 — administration and the field-agent portal

`archive/v2` · tag `v2.0.0`

The first major expansion beyond a consumer product:

- **`/admin`** — the administrative dashboard and its API surface.
- **`/agent`** — a field-agent portal so inspectors can visit startup offices and file structured reports.
- **`SETUP.md`** — a proper local and production setup guide.
- **`prisma/0003_admin_system.sql`** — the incremental SQL that creates the admin-system tables, roles and
  permission grants on an existing database.

---

## v3 — e-mail delivery

`archive/v3` · tag `v3.0.0`

Added `src/lib/mailer.ts` and wired it into verification, password-reset and notification flows. When
`RESEND_API_KEY` is absent the mailer logs to the server console instead of sending, so local development
never requires an e-mail account.

---

## v4 — the multi-vertical platform

`archive/v4` · tag `v4.0.0`

The release that turned StartupzConnect from "a startup directory" into a platform. Five new verticals:

- **Co-founders** — listings with skill and availability matching.
- **Events** — listings with RSVP.
- **Press** — a request/response workflow.
- **Grants** — a curated catalogue of Indian startup funding schemes.
- **Mentors** — a directory with expertise and availability.

It also introduced the **Vitest** suite and the first unit tests over the shared libraries.

---

## v5 — real storage and real alerting

`archive/v5` · tag `v5.0.0`

- **`src/lib/storage.ts`** — Cloudflare R2 integration with separate public and private buckets, upload
  validation, and short-lived signed URLs for sensitive objects. Retains the local `/public/uploads`
  fallback for development only.
- **`src/lib/alerts.ts`** — optional Slack webhook error alerting.

---

## The parallel branches

Two development lines ran alongside the main sequence and are preserved as their own branches.

### `archive/fixed` · tag `v5.0.0-fixed`

A hardening branch that introduced two shared libraries ahead of their merge into the main line:

- **`src/lib/turnstile.ts`** — Cloudflare Turnstile verification with a fail-closed default.
- **`src/lib/url-safety.ts`** — URL safety checks, used to block dangerous schemes and hosts.

### `archive/admin-foundation` · tag `v5.1.0-foundation`

The admin and security system extracted as a **standalone, independently testable library**:

```
src/lib/permissions.ts          role → permission matrix
src/lib/approval-policy.ts      who may approve what
src/lib/csrf-core.ts            origin/referer validation
src/lib/password-policy.ts      password strength rules
src/lib/registration-rules.ts   role eligibility at signup
src/lib/site-settings-schema.ts typed settings with history
src/lib/transitions.ts          lifecycle state machine
src/lib/redact.ts               audit-log metadata redaction
src/lib/url-safety.ts           URL safety checks
src/lib/turnstile.ts            Turnstile verification
docs/                            ADMIN-ROLES, INTEGRATION, MIGRATIONS, STATUS, TESTING
migrations/0003_admin_system.sql
scripts/gen-docs.mjs  scripts/verify-migration.mjs
src/lib/__tests__/              9 test suites
```

Its value is that the permission model could be reasoned about, tested and documented independently of the UI.

---

## v5.1 — the merge

`archive/v5.1` · tag `v5.1.0`

The admin foundation was merged back into the application, and multi-device session management was restored:

- All ten foundation modules landed under `src/lib/`.
- **`src/lib/sessions.ts`** — refresh tokens are hashed with bcrypt before storage; sessions can be revoked
  individually or all at once ("log out everywhere").
- **`src/lib/admin-auth.ts`** — `authorizeAdmin()` combining CSRF validation, token verification and a live
  database role/permission check.
- The schema grew to 30 models, adding `Session`, `RateLimit`, `AdminRoleAssignment`, `AuditLog`,
  `ApprovalRequest`, `SecurityIncident`, `SiteSetting` and `SiteSettingHistory`.

---

## v6.0.0 — the consolidated release

`master` · tag `v6.0.0` · current

This is the release on `master`. It is v5.1 plus the work done during consolidation.

### Legal consent

Registration now supports **visit-gated legal consent**. A prospective user must actually open the Terms of
Service and Privacy Policy before the consent checkbox becomes available, and the app records which documents
a given visitor has read.

- **`src/lib/legal-consent.ts`** — `markLegalDocRead`, `getLegalDocsRead`, `clearLegalDocsRead`, and the
  `LegalDoc` type. Backed by `localStorage`, so it works before an account exists.
- **`src/components/LegalReadTracker.tsx`** — a client component mounted in the Terms and Privacy pages that
  records the visit.
- **`src/app/register/RegisterClient.tsx`** — the consent gate and the agreement validation.
- **`src/context/AuthContext.tsx`** — `register(name, email, password, role, acceptTerms, profile?)` now
  forwards the acceptance flag and optional profile data.
- **`scripts/verify-consent.mjs`** — four assertions that pin the contract.

### UI and UX

Rebuilt navbar and footer branding, replaced the homepage favicon, and improved the filtering on the
startups, jobs and co-founders directories.

### Client-component correctness

`'use client'` was added to 11 admin pages that were using React state and event handlers without declaring
the directive.

### Repository hardening

The consolidation itself changed how the project is stored and documented:

- `.gitignore` rewritten to cover `.env*` (with `.env.example` explicitly kept), all SQLite artefacts,
  build output, Cloudflare state and runtime uploads.
- `.env.example` rewritten so that every value is a placeholder and every variable the code actually reads is
  documented — including `R2_PUBLIC_BUCKET_NAME` / `R2_PRIVATE_BUCKET_NAME`, which the previous template named
  incorrectly, and `TURNSTILE_SECRET_KEY`, which was missing entirely.
- The eleven files that existed in v5.1 but had been dropped from the working copy — the `docs/` set and
  `scripts/security-check.mjs` — were restored.
- A full secret audit was run across every version. See [`SECURITY.md`](SECURITY.md).
- `LICENSE` added (MIT).

### Build and correctness repairs

v5.1 could not actually be built. Bringing it to a working state required fixing four separate problems:

1. **Infinite build recursion.** The `build` script called the OpenNext bundler, and OpenNext calls
   `npm run build` internally. Every build restarted itself. Split into `build` (Next.js) and `build:worker`
   (the Cloudflare bundle).
2. **22 TypeScript errors.** Next.js type-checks during `next build`, so every one of these was a hard build
   failure, not a warning. All 22 are fixed, and the count is now zero.
3. **A broken access token.** `issueAuthSession()` signed `{ id }` only, yet ~25 route handlers authorised on
   `decoded.role` — a claim that was therefore always `undefined`, making those checks impossible to
   satisfy. The token now carries `{ id, email, role }`, matching the refresh route.
4. **A missing dependency.** `@aws-sdk/s3-request-presigner`, imported by `src/lib/storage.ts`, was absent
   from `package.json` and from `node_modules`.

Two prerendering failures (`useSearchParams()` in `/reset-password` and `/verify-email`) were also resolved
with `Suspense` boundaries.

The result: `npm run build` succeeds, `npm run typecheck` reports zero errors, and `npm run test` passes
50 / 50. The lint baseline is unchanged from v5.1 — 274 errors across 128 files, none introduced here.

### History

The consolidated `master` carries the full evolutionary lineage in a single linear history:

```
v0.0.0  (archive/v0)
   └── v1.0.0  (archive/v1)  ← the seven original commits, dev.db purged
          └── v2.0.0  (archive/v2)
                 └── v3.0.0  (archive/v3)
                        └── v4.0.0  (archive/v4)
                               └── v5.0.0  (archive/v5)
                                      └── v5.1.0  (archive/v5.1)
                                             └── v6.0.0  (master)
```

The `fixed` and `admin-foundation` lines remain side branches, preserved with their own tags.
