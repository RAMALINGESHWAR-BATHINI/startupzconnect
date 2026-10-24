# StartupzConnect — Next Implementation Plan (Schema-Gated Milestone)

## Recommended first task
**Vendor offerings + RFQ (B2B) schema proposal + implementation behind approval.**

Rationale: largest product differentiator (B2B marketplace), unlocks transaction-ready monetization later, and can be built additively on the canonical `Organization` model already shipped. Ownership transfer and saved orgs are narrower; RFQs have more downstream value (introductions, enquiries, documents) and exercise the org graph + private R2 + audit boundaries end-to-end.

---

## 1. Remaining requirements vs current state

Source: `StartupzConnect Product Vision &.txt` + `docs/AUDIT.md` + `docs/PRD.md` + progress log.

| Vision requirement | State | Blocker |
|---|---|---|
| Unified org graph (orgs, memberships, roles) | Done (Organization, OrganizationMembership; Startup.orgId nullable) | — |
| Org directory/search/filters | Done (stage, verified-only) | — |
| Profile claims + review + evidence upload | Done (ProfileClaim, ClaimEvidence, R2 private) | R2 creds for E2E |
| Org profile editing | Done (PATCH /api/startups/[id]) | — |
| B2B vendor offerings / catalog | Missing | Schema |
| RFQs / buyer-vendor enquiries / procurement | Missing | Schema |
| Saved organizations | Missing | Schema |
| Ownership transfer (founderId) | Blocked | founderId non-nullable |
| SEO landing pages | Partial (sitemap dynamic) | Data/taxonomy |
| Analytics / monetization | Out of scope | — |

## 2. Prioritization (next milestone)

1. Vendor offerings + RFQs (highest product value, exercises org graph, R2, audit).
2. Ownership transfer (unblocks org governance; smaller, depends on approval flow already present).
3. Saved organizations (low risk, simple join table; can ship with #1).
4. SEO landing pages (data-driven, after taxonomy stable).
5. Analytics/monetization (later, gated on usage evidence).

## 3. Schema-gated feature specs

### A. Vendor offerings + RFQs (recommended first)

Current schema: `Startup` (org-linked via nullable `orgId`), `Organization`, `OrganizationMembership`, `CollaborationRequest` (existing enquiries). No vendor catalog or RFQ models.

Required additive changes (proposal only, not applied):
- `VendorOffering`: id, organizationId (FK Organization), title, description, category (string enum validated in app), capabilities (Json/string[]), pricingModel (enum string), deployment (string), certifications (Json), status (DRAFT/PUBLISHED/ARCHIVED), createdAt, updatedAt. Index organizationId, status, category.
- `Rfq`: id, buyerOrganizationId (FK Organization, nullable for anonymous? recommend required org), title, description, category, budgetRange, deadline, status (DRAFT/OPEN/CLOSED/ AWARDED/CANCELLED), createdAt, updatedAt. Index buyerOrganizationId, status, category.
- `RfqResponse`: id, rfqId (FK Rfq), vendorOrganizationId (FK Organization), message, priceQuote, attachments (Json of R2 keys), status (SUBMITTED/SHORTLISTED/REJECTED/ACCEPTED), createdAt, updatedAt. Unique (rfqId, vendorOrganizationId) to prevent duplicate bids. Index rfqId, vendorOrganizationId.
- `RfqDocument` (optional, or reuse R2 key list on RfqResponse): private R2 keys, authorized download via signed URL.

Affected routes/UI:
- `/api/organizations/[id]/offerings` (GET/POST/PATCH/DELETE) — org ADMIN/OWNER.
- `/api/rfqs` (GET list with filters, POST create) — authenticated buyer org.
- `/api/rfqs/[id]` (GET detail, PATCH status) — buyer org or vendor with response.
- `/api/rfqs/[id]/responses` (POST bid, GET list) — vendor org ADMIN/OWNER; buyer sees all, vendor sees own.
- `/api/rfqs/[id]/responses/[rid]/documents` — signed URL download, org-scoped.
- UI: vendor catalog page, RFQ create form, RFQ detail/bid page, org dashboard offerings tab.

Data migration: none required (additive tables; existing orgs get no offerings until created). Backfill not needed. Rollback = drop new tables (no data loss to existing).

Authorization:
- All mutations require live `hasOrgMembership(orgId, ['OWNER','ADMIN'])`.
- RFQ visibility: buyer org members + vendors who responded; admin (live `authorizeAdmin`) full read.
- Documents private R2, signed URLs, org-scoped auth. Default-deny.

Acceptance tests:
- Org member creates offering; non-member 403.
- Buyer creates RFQ; vendor (different org) submits one response; duplicate response rejected.
- Cross-org read denied (org A cannot read org B's draft RFQ).
- Document download requires membership/admin; signed URL expires.
- Typecheck 0, tests green, security check unchanged.

### B. Ownership transfer

Current schema: `Startup.founderId Int` (non-nullable). `Organization` exists; `OrganizationMembership` has OWNER role. Transfer can be executed by updating `Startup.founderId` + ensuring new owner has OWNER membership — no nullability change needed if executed atomically. The reported "needs approval" is about governance, not schema nullability.

Required schema changes: none (reuse existing columns + `ApprovalRequest` with new type `OWNERSHIP_TRANSFER`).

Affected routes/UI:
- `POST /api/startups/[id]/transfer-ownership` (founder or live admin) — creates ApprovalRequest (type OWNERSHIP_TRANSFER), payload { startupId, fromUserId, toUserId }, requires password reauth + independent GLOBAL_ADMIN approval.
- Approvals route execution branch for OWNERSHIP_TRANSFER: update `Startup.founderId`, upsert `OrganizationMembership` OWNER for new user, demote old founder to ADMIN (or remove), audit log. Transactional.
- UI: transfer request form on org dashboard; approval queue already exists.

Authorization: requester must be founder or live admin with `admin.roles.assign`? Recommend new permission `startups.ownership.transfer`? To avoid permission-registry churn, reuse existing `admin.roles.assign` gated behind approval (founder-initiated allowed without admin permission, reviewed by GLOBAL_ADMIN). Need to decide: allow founder self-service request (creates approval) vs admin-only. Recommend founder-initiated + GLOBAL_ADMIN approval (consistent with sensitive role changes).

Acceptance tests: founder requests transfer to existing member; same-user approval denied; execution updates founderId + membership; rollback on failure; audit event present.

### C. Saved organizations

Current schema: none. Add `SavedOrganization`: id, userId (FK User), organizationId (FK Organization), createdAt. Unique (userId, organizationId). Index userId.

Affected routes/UI: `POST/DELETE /api/me/saved-organizations`, `GET /api/me/saved-organizations`, saved list UI, save button on org profile.

Authorization: user-scoped only; no org membership required to save. Rate limit.

Acceptance tests: save/unsave idempotent; cross-user isolation; list pagination.

## 4. Comparison and recommendation

| Criterion | Ownership transfer | Vendor offerings/RFQs | Saved orgs |
|---|---|---|---|
| Product value | Medium (governance) | High (B2B differentiator) | Low (convenience) |
| Schema risk | Low (none) | Medium (4 new tables) | Low (1 table) |
| Dependency on org graph | Uses it | Uses it heavily | Uses it |
| Security surface | High (sensitive) | High (docs, multi-org) | Low |
| Enables monetization | No | Yes (premium RFQ tools) | No |

**Recommendation: implement Vendor offerings + RFQs first**, with Saved organizations bundled (small, same migration window). Ownership transfer second (can ride along if approval flow extended in same PR, but separate approval reduces risk).

## 5. D1/Prisma compatibility & migration safety

- Use `prisma db push` (current tooling, no migration engine). Prepare SQL by hand for production; keep manual admin SQL.
- D1 limitations: no native enum (use string + app validation), limited ALTER; prefer additive tables over column changes. New tables are safe.
- Nullable `orgId` already pattern; keep FKs with `onDelete: Cascade` only where child-owned (offerings, responses); for RFQ buyer/vendor orgs use `onDelete: Restrict` to preserve audit.
- Preserve existing data: additive only; no edits to Startup/User/Organization rows; no backfill needed for new tables.
- Backup: export D1 via `wrangler d1 export` (or `prisma db pull` snapshot) before applying; keep `.sql` dump in `docs/migrations/` (not tracked secrets). Local dev: copy `dev.db`.
- Validation: run `prisma generate`, typecheck, tests on a fresh DB (`prisma db push` against local SQLite), manual smoke of create/bid/download, security scanner. Do NOT apply to production without separate approval.
- Transaction atomicity on D1: verify with a deliberate failure test in local SQLite (rollback of offering+audit). Note D1 transaction support differs; document limitation.

## 6. Dependency-ordered implementation plan

1. Schema proposal review + approval (this doc section 3A).
2. Add models to `prisma/schema.prisma` (additive only); `prisma generate`; typecheck.
3. Local `prisma db push` to dev DB; verify.
4. Implement offerings API + UI (org-scoped auth).
5. Implement RFQ API + UI.
6. Implement R2 document upload/download for RFQ responses (reuse storage.ts signed URLs).
7. Add saved organizations (bundle).
8. Tests: org isolation, cross-org denial, document auth, duplicate bid rejection.
9. Typecheck + tests + security check + build check.
10. Ownership transfer (separate, after #9): approval-policy type + request endpoint + execution branch + tests.

Completion criteria (per feature): underlying workflow works E2E, server-side auth enforced, data persisted, UI reflects success/failure, loading/empty/error states, tests/manual evidence, no paid deps, no prod changes.

## 7. Safe no-schema work available now (optional, not required)

- Add sector/capability landing pages generated from existing Startup data (read-only, no schema) — improves SEO.
- Membership tests using in-memory SQLite fixtures (test infra, no schema) — closes a reported blocker.
- Extend sitemap with events/grants (already dynamic pattern).
- Do NOT invent tasks; these are the only genuinely safe, value-adding items.

---

**Awaiting approval before any schema or code changes.** First implementation task if approved: Vendor offerings + RFQ schema (section 3A) + additive migration proposal. Files affected: `prisma/schema.prisma`, new routes under `src/app/api/organizations/[id]/offerings`, `src/app/api/rfqs`, `src/app/api/rfqs/[id]/responses`, `src/lib/hasOrgMembership.ts` (reuse), `src/lib/storage.ts` (reuse), new UI pages under `src/app/rfqs`, `src/app/vendors`, tests under `src/lib/__tests__`.
