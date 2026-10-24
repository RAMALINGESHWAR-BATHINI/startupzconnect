# StartupzConnect — Product Requirements Document (PRD)

Based on the Product Vision & Strategic Roadmap and the repository audit (`docs/AUDIT.md`).

## 1. Decisions (finalized per recommendation)

1. Geography: Hyderabad/Telangana first, expand to India.
2. Lead market: hybrid from the beginning, limited initial features.
3. Initial data: combination of seeded public-source profiles + self-registration.
4. Monetization: keep core features free while validating demand.
5. Next after this: design directory, search, taxonomy, organization profiles.

## 2. MVP scope (Phase 0–2)

### In scope
- Unified `Organization` model with memberships and roles (founder, member, admin).
- Organization profiles with verification states and source/confidence/correction metadata.
- Taxonomy (sector, stage, capability) and indexed search/filters.
- Profile claims + correction/removal workflow.
- Preserve existing `Startup` records and user identities via migration.
- Admin: review claims, moderate profiles, audit actions.

### Out of scope (later phases)
- RFQs, buyer-vendor introductions, procurement docs (Phase 4).
- AI enrichment, ranking, analytics, premium plans (Phase 5–6).
- Blockchain, microservices, automatic scraping without consent.

## 3. Dependencies
- Existing auth/session/permission system (reuse).
- D1/SQLite schema migration tooling (`prisma db push` + manual SQL).
- R2 for document evidence.

## 4. Security requirements
- Deny-by-default authorization on all org/profile operations.
- Explicit permission checks per acting user vs target org.
- Private documents via signed URLs; no predictable object URLs.
- Audit log for claim review, verification, moderation.
- Rate limiting on claim/correction endpoints.
- Evidence-backed compliance claims (store evidence, scope, status, expiry).

## 5. Acceptance criteria (Phase 2 exit)
- One organization participates in multiple areas without duplicate records.
- Users can search/filter orgs by sector, stage, geography.
- Org owner can claim profile, request corrections, request removal.
- Admin can review/approve/reject claims with audit trail.
- Regression tests cover claim + verification flows.
- Typecheck and tests pass.
