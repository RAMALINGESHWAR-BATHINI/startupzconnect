# StartupzConnect

**A multi-vertical platform connecting student founders, startups, investors, mentors, co-founders, employers, institutions and field agents — with a hardened, role-based administration system.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-087fa4?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)](https://www.prisma.io)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-Cloudflare%20orange?logo=cloudflare)](https://workers.cloudflare.com)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

---

## Table of Contents

- [What is StartupzConnect](#what-is-startupzconnect)
- [Feature Overview](#feature-overview)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Roles and Permissions](#roles-and-permissions)
- [Deployment](#deployment)
- [Security Model](#security-model)
- [Version History](#version-history)
- [Documentation](#documentation)
- [Known Issues](#known-issues)
- [Contributing](#contributing)

---

## What is StartupzConnect

StartupzConnect is a full-stack startup ecosystem platform built on the Next.js App Router. It began as a
Java/JSP prototype and evolved through six Next.js releases into a production-oriented platform with:

- **Eight product verticals** — startups, jobs, co-founders, investments, events, grants, mentors and press.
- **A field-inspection pipeline** — field agents visit startup offices, file structured inspection reports, and
  admins review and resolve them.
- **A five-role administrative system** with deny-by-default permissions, separation of duties, independent
  approvals for dangerous actions, and an append-only audit log.
- **Multi-device session management** with hashed refresh tokens, per-session revocation, and "log out everywhere".
- **Private document storage** on Cloudflare R2, served exclusively through short-lived signed URLs.
- **Deployment to Cloudflare Workers** via OpenNext, using Cloudflare D1 as the production database.

---

## Feature Overview

| Area | Details |
|------|---------|
| **Authentication** | Register / login / logout, refresh rotation, e-mail verification, password reset, "log out everywhere", optional investor & mentor profile flows, visit-gated legal consent. |
| **Startups** | Directory with search and filters, startup profiles, team members, work logs, office check-ins, document vault, peer reviews. |
| **Jobs** | Job openings, application flow, applicant dashboard. |
| **Co-founders** | Co-founder listings with skill and availability matching. |
| **Investments** | Investment-interest tracking, investor profiles with SEBI registration and verification workflow. |
| **Events** | Event listings with RSVP. |
| **Grants** | Curated Indian startup funding schemes (SISFS, SIDBI FFS, T-Fund, CGTMSE, NIDHI-PRAYAS, DPIIT). |
| **Mentors** | Mentor directory with expertise and availability. |
| **Press** | Press request / response workflow. |
| **Field inspections** | Field-agent portal, inspection reports, office check-ins, document verification, institution partnerships. |
| **Administration** | Users, roles, permissions, approvals, audit logs, security incidents, site settings with history, data exports, design/branding controls, diagnostics. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router, React 19.2, Server Components) |
| Language | TypeScript 5 |
| ORM | Prisma 6 with driver adapters |
| Database | SQLite (local development) · Cloudflare D1 (production) |
| Auth | JWT HS256 access + refresh tokens · bcrypt · per-device `Session` rows |
| Storage | Cloudflare R2 — separate public and private buckets, 5-minute signed URLs |
| Bot protection | Cloudflare Turnstile (fail-closed when configured) |
| Email | Resend, with console fallback in development |
| Testing | Vitest (50 test cases across 7 suites) |
| Linting | ESLint 9 + `eslint-config-next` |
| Edge runtime | Cloudflare Workers via `@opennextjs/cloudflare` |

---

## Quick Start

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A Cloudflare account (only required for production deployment)

### 1. Install dependencies

```bash
npm install
```

`postinstall` runs `prisma generate`, so the Prisma client is always in step with `prisma/schema.prisma`.
If you install with `--ignore-scripts`, run `npx prisma generate` manually.

### 2. Configure the environment

```bash
cp .env.example .env.local    # Windows: copy .env.example .env.local
```

`.env.local` is git-ignored. At minimum, generate two **different** signing secrets:

```bash
openssl rand -base64 64   # ACCESS_TOKEN_SECRET
openssl rand -base64 64   # REFRESH_TOKEN_SECRET
```

Full variable reference: [`docs/ENV-VARS.md`](docs/ENV-VARS.md).

### 3. Create the database

```bash
npx prisma generate
npx prisma db push
```

### 4. Bootstrap the first admin account (optional)

```bash
npm run db:seed
```

This reads `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_NAME` from `.env.local`, creates the admin account,
registers it as a field agent, and seeds the Grants catalogue. It is idempotent — safe to re-run.

### 5. Start the development server

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the Next.js development server on port 3000. |
| `npm run build` | Generate the Prisma client and run the Next.js production build. |
| `npm run build:worker` | Build the Cloudflare Workers bundle via OpenNext. **Requires Linux, macOS or WSL** — see [Deployment](#deployment). |
| `npm run start` | Start the production Next.js server. |
| `npm run lint` | Run ESLint over the project. |
| `npm run test` | Run the Vitest suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run db:seed` | Bootstrap the admin/agent account and seed the grants catalogue. |
| `npm run preview` | Build and preview the Workers bundle locally. |
| `npm run deploy` | Build the Workers bundle and deploy it to Cloudflare. |

Two standalone verification scripts are also available:

```bash
npm run security:check    # static security assertions over the source tree
npm run verify:consent    # asserts the legal-consent gating contract
npm run typecheck         # tsc --noEmit
```

### Verification status of this release

| Check | Result |
|-------|--------|
| `npm run typecheck` | **0 errors** (v5.1 baseline: 22) |
| `npm run test` | **50 / 50 passing** across 7 suites |
| `npm run build` | **Succeeds** — 45 pages, 75 API routes, 100 static pages prerendered |
| `npm run lint` | 274 errors / 128 files — **identical to the v5.1 baseline**; none introduced here |
| `npm run security:check` | 0 failures, 27 advisories (legacy role-trust call sites) |
| `npm run verify:consent` | 4 / 4 assertions passing |

---

## Project Structure

```
src/
  app/
    (public)          landing, startups, jobs, cofounders, investments,
                      events, grants, mentors, press, terms, privacy
    auth/             login, register, forgot/reset password, verify email
    dashboard/        profile, notifications, startup management, role profiles
    admin/            15 administration screens (roles, approvals, audit logs, …)
    agent/            field-agent inspection portal
    api/              75 route handlers (auth, admin, agent, verticals)
  components/         shared UI (Navbar, Footer, cards, badges, file upload, …)
  context/            AuthContext — client session state, server-trusted roles
  lib/                25 shared modules (auth, sessions, permissions, storage, …)
  instrumentation.ts  Sentry-compatible error capture
prisma/
  schema.prisma      30 models
  seed.ts            admin + agent bootstrap and grants catalogue
  0003_admin_system.sql   incremental admin-system SQL
docs/                 architecture, deployment, security, API and migration notes
scripts/              security and consent verification scripts
```

---

## Roles and Permissions

The platform has **five primary admin roles** and **five operational roles**. Permissions are deny-by-default,
there is no inheritance, and the reporting line is informational only — a role grants exactly the permissions
listed for it.

| Role | Scope |
|------|-------|
| `GLOBAL_ADMIN` | Platform administration: role assignment, approvals, review queues, audit oversight. |
| `DEV_ADMIN` | Application health, diagnostics, integration status. No business data. |
| `SEC_ADMIN` | Security events, access reviews, session revocation, suspension, incident response. No business data. |
| `DATA_ADMIN` | Database health, data quality, retention, export **requests** (approvals are separate). |
| `DESIGN_ADMIN` | Branding, homepage content and navigation, with draft/publish/rollback. |
| `CONTENT_EDITOR` | Edits draft site content; cannot publish. |
| `SECURITY_ANALYST` | Read-only view of security events and audit logs. |
| `SUPPORT_OPERATOR` | Works the inspection, document and content-report review queues. |
| `DATABASE_OPERATOR` | Read-only database health and record statistics. |
| `AUDITOR_READONLY` | Read-only view of audit logs and role assignments. |

The full matrix lives in [`src/lib/permissions.ts`](src/lib/permissions.ts) and is documented in
[`docs/ADMIN-ROLES.md`](docs/ADMIN-ROLES.md).

---

## Deployment

The production target is **Cloudflare Workers** with **Cloudflare D1** as the database.

```bash
npm run build:worker     # build the Workers bundle
npm run deploy           # build + wrangler deploy
```

> **Platform requirement.** The OpenNext bundler creates directory symlinks while assembling the Worker
> bundle. That requires a symlink-capable filesystem — **Linux, macOS, or WSL**. On native Windows the
> bundler fails with `EPERM: operation not permitted, symlink` unless Windows Developer Mode is enabled
> (OpenNext itself warns that it is not fully Windows-compatible). The Next.js build (`npm run build`) runs
> fine on any platform, so Windows works for development, testing and `next build`.

Key points:

- The `wrangler.jsonc` D1 binding (`DB`) is injected by the Cloudflare runtime; do **not** set it locally.
- `@prisma/adapter-d1` transparently routes Prisma to D1 in the Workers environment.
- R2 must be configured for uploads — the local `/public/uploads` fallback only works on the Node filesystem.
- See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and [`SETUP.md`](SETUP.md) for the full procedure.

---

## Security Model

- **Deny-by-default authorization.** Unknown roles and unknown permissions grant nothing.
- **Token-purpose claims.** Every JWT carries a `purpose` (`access` / `refresh`), so tokens cannot be swapped.
- **Algorithm pinning.** Only `HS256` is accepted; `alg:none` and algorithm-confusion attacks are rejected.
- **Hashed refresh tokens.** Refresh tokens are hashed with bcrypt before storage; sessions are revocable individually.
- **CSRF protection** on all unsafe methods, via origin/referer validation.
- **Turnstile** on register, login, forgot-password and resend-verification — fail-closed once configured.
- **Rate limiting** per e-mail and per IP, backed by a `RateLimit` table; sensitive operations fail closed.
- **Magic-byte file validation** — uploads are verified against their real content type, not the declared one.
- **Private documents** are never given permanent public URLs; access is via 5-minute signed URLs.
- **Append-only auditing** — `AuditLog` and `SiteSettingHistory` are protected by database triggers.
- **Audit metadata is redacted** before persistence, so secrets never reach the audit trail.

See [`docs/SECURITY-POLICIES.md`](docs/SECURITY-POLICIES.md) for the full policy set.

> **Secret hygiene.** `.env.local` is git-ignored, `.env.example` contains placeholders only, and SQLite
> database files are excluded from version control. See [`docs/SECURITY.md`](docs/SECURITY.md) for the
> consolidation-time secret audit and the remediation that was applied.

---

## Version History

Every historical version of the platform is preserved in this repository.

| Tag | Branch | Release | Summary |
|-----|--------|---------|---------|
| `v0.0.0` | `archive/v0` | Original | Java/JSP prototype — servlets, JSP pages, raw SQL schema. |
| `v1.0.0` | `archive/v1` | 2026-05-16 | First Next.js release: auth, startups, jobs, investments, Cloudflare deployment wiring. |
| `v2.0.0` | `archive/v2` | — | Admin panel, field-agent portal, deployment setup guide. |
| `v3.0.0` | `archive/v3` | — | Resend mailer and e-mail notification plumbing. |
| `v4.0.0` | `archive/v4` | — | Co-founder, events, press, grants and mentors verticals; Vitest suite introduced. |
| `v5.0.0` | `archive/v5` | — | Cloudflare R2 storage and error alerting. |
| `v5.0.0-fixed` | `archive/fixed` | — | Parallel hardening branch: Turnstile helper and URL-safety validator. |
| `v5.1.0` | `archive/v5.1` | — | Admin foundation merged in; hashed multi-device sessions restored. |
| `v5.1.0-foundation` | `archive/admin-foundation` | — | The admin/security library as a standalone package, with its own tests and docs. |
| **`v6.0.0`** | **`master`** | **current** | **Consolidated release: v5.1 plus the legal-consent flow, UI/UX fixes and repository hardening.** |

```bash
git checkout archive/v2        # inspect any historical release
git diff v4.0.0 v5.0.0        # compare two releases
```

The full narrative is in [`docs/EVOLUTION.md`](docs/EVOLUTION.md), and the per-release detail is in
[`docs/RELEASE_HISTORY.md`](docs/RELEASE_HISTORY.md).

---

## Documentation

| Document | Contents |
|----------|----------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, directory layout, security principles. |
| [`docs/API-DOCS.md`](docs/API-DOCS.md) | API surface overview and conventions. |
| [`docs/PLATFORM-POLICIES.md`](docs/PLATFORM-POLICIES.md) | The full platform policy — registration, inspections, investor, review, jobs, content, data, fees and enforcement. |
| [`docs/ADMIN-ROLES.md`](docs/ADMIN-ROLES.md) | The five primary and five operational admin roles. |
| [`docs/SECURITY-POLICIES.md`](docs/SECURITY-POLICIES.md) | Security policy set and enforcement points. |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Consolidation-time secret audit, findings and remediation. |
| [`docs/ENV-VARS.md`](docs/ENV-VARS.md) | Every environment variable, required vs optional. |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Cloudflare Workers deployment. |
| [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md) | Applying the admin-system SQL migration. |
| [`docs/RECOVERY.md`](docs/RECOVERY.md) | Incident and account-recovery procedures. |
| [`docs/TESTING.md`](docs/TESTING.md) | Test strategy and how to run the suite. |
| [`docs/EVOLUTION.md`](docs/EVOLUTION.md) | How the platform evolved from v0 to v6. |
| [`docs/RELEASE_HISTORY.md`](docs/RELEASE_HISTORY.md) | Detailed per-release changelog. |
| [`docs/PHASE1-GAPS.md`](docs/PHASE1-GAPS.md) | The Phase 1 readiness review and which gaps are still open. |
| [`SETUP.md`](SETUP.md) | Step-by-step local setup, feature walkthrough and roadmap. |

---

## Known Issues

These are tracked in the consolidated release. The consolidation itself **fixed** the build-breaking
type errors and the missing dependency that v5.1 carried — see [Fixed during consolidation](#fixed-during-consolidation).

1. **Lint errors are inherited, not new.** `npm run lint` reports 274 errors across 128 files, almost all
   `@typescript-eslint/no-explicit-any`. The v5.1 baseline is **identical** (274 errors, 128 files) — the
   consolidation introduced none. They are cosmetic type-assertion issues, not build blockers.

2. **27 legacy role-trust call sites.** Some older route handlers authorise with a token claim
   (`decoded.role !== 'ADMIN'`) rather than the `authorizeAdmin()` helper, which performs a live database
   role and permission check. A role change therefore takes effect only after the access token rotates
   (≤ 15 minutes). `npm run security-check` reports these as advisories. Migrating them to
   `authorizeAdmin()` is the recommended follow-up.

3. **`prisma/migrations/` is git-ignored.** The project uses `prisma db push` rather than Prisma's migration
   engine, so the hand-written admin-system SQL is kept at `prisma/0003_admin_system.sql` instead.

4. **The Workers bundle cannot be built on native Windows** without enabling Developer Mode — see
   [Deployment](#deployment).

5. **The build needs network access to `fonts.googleapis.com`.** `src/app/layout.tsx` loads Inter through
   `next/font/google`, which is fetched at build time. On a fully offline machine, or behind a firewall that
   blocks Google Fonts, `npm run build` fails with a font-loading error. Bundle the font locally with
   `next/font/local` if you need hermetic builds.

### Fixed during consolidation

| Issue | Fix |
|-------|-----|
| `npm run build` recursed infinitely (`build` → OpenNext → `build`) | Split into `build` (Next.js) and `build:worker` (OpenNext). |
| `npx tsc --noEmit` reported 22 errors, which **failed the build** | All 22 fixed: 9 `isEmailVerified()` arity errors, dead `searchEntries` code, an invalid `isAnonymous` Prisma select, a missing `email` selection, a `string[] \| null` iteration, and 7 test type errors. Now 0. |
| The access token carried only `{ id }`, so `decoded.role` was `undefined` in ~25 route handlers | `issueAuthSession()` now signs `{ id, email, role }`, matching the refresh route. |
| `@aws-sdk/s3-request-presigner` was imported but absent from `package.json` | Added as a dependency. |
| `prisma/dev.db` was committed publicly, with user rows, password hashes and live refresh tokens | Removed from every commit on every branch and tag. See [`docs/SECURITY.md`](docs/SECURITY.md). |
| `useSearchParams()` broke static prerendering of `/reset-password` and `/verify-email` | Both wrapped in a `Suspense` boundary. |
| `docs/` and `scripts/security-check.mjs` were missing from the working copy | Restored from v5.1. |
| `.env.example` named `R2_BUCKET_NAME`, which the code never reads, and omitted `TURNSTILE_SECRET_KEY` | Rewritten with the correct variable names and placeholders only. |

---

## Contributing

1. Fork the repository and create a topic branch.
2. Run `npm run lint` and `npm run test` before opening a pull request.
3. Never commit `.env.local`, database files, or any real credential. `scripts/security-check.mjs` asserts this.
4. Keep the permission registry in `src/lib/permissions.ts` as the single source of truth, and add a test with
   every permission change.

---

## License

Copyright (c) 2026 Ramalingeshwar Bathini. All Rights Reserved.

This project is proprietary. No part may be used, copied, modified, or distributed
without prior written permission. See [`LICENSE`](LICENSE).
