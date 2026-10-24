# StartupzConnect — Product & Repository Audit

Audit of the existing codebase (v6.0.0, master) against the Product Vision & Strategic Roadmap.

## 1. Current product (what exists)

- Next.js 16 App Router, React 19, TS 5, Prisma 6, SQLite/D1, Cloudflare Workers/R2.
- 8 verticals: startups, jobs, co-founders, investments, events, grants, mentors, press.
- Field-inspection pipeline (field agents, reports, office check-ins, document verification, institution partners).
- 5-role admin system (deny-by-default, approvals, audit log, security incidents, site settings/history, data exports, diagnostics).
- Multi-device sessions (hashed refresh tokens, revocation).
- Private R2 storage with 5-min signed URLs.
- 30 Prisma models, 75 API routes, 45 pages, 50 tests (7 suites), typecheck 0 errors.

## 2. Vision gaps (not yet present)

- Unified organization graph: no `Organization` model; companies are `Startup` only. No org roles/memberships, no multi-capacity participation (vendor, employer, partner).
- B2B marketplace: no vendor profiles, product/service catalogs, RFQs, buyer-vendor introductions, procurement documents.
- People graph: users have roles but no unified person/org membership model; mentors/investors are profiles, not org-linked.
- Discovery: basic search/filters exist; no saved searches, advanced relevance, taxonomy-driven discovery, verified org claims.
- Trust: verification states are ad-hoc (investor SEBI); no evidence-backed compliance claims, source/confidence/correction workflows, public-data ingestion.
- Scale/intelligence: no AI enrichment, ranking, ecosystem analytics, premium plans, SEO landing pages.
- Monetization: none implemented.

## 3. Security & quality findings

- 27 legacy role-trust call sites (token claim vs live DB check) — advisories.
- Lint: 274 errors / 128 files (inherited, cosmetic `any`).
- Workers build needs Linux/macOS/WSL or Developer Mode on Windows.
- Build needs network access to fonts.googleapis.com.
- Migrations via `prisma db push` (no migration engine); admin SQL kept manually.

## 4. Open planning decisions (from vision doc)

1. Geography: Hyderabad/Telangana vs India-wide vs global.
2. Lead market: startup ecosystem vs B2B vs hybrid limited.
3. Initial data sourcing: seeded public profiles vs self-registered vs combo.
4. Monetization: free core vs sponsorships vs premium subscriptions.
5. Next step: audit (this doc) vs design directory/search vs design RFQs vs finalize decisions.

## 5. Recommended next step

Finalize the five decisions above, then produce a PRD with explicit inclusions, exclusions, dependencies, security requirements, and acceptance criteria per milestone (Phase 0–6).
