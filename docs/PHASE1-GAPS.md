# Phase 1 Readiness — Remaining Implementation Gaps

> Grounded in a direct audit of the codebase, not a general checklist.

This is the readiness review carried out at the end of the Phase 1 build. Every item below was found by
checking the actual code — each is either confirmed present or confirmed absent, not assumed.

## Summary

Everything from the Phase 1 checklist is implemented, except the three items explicitly deferred: payment
gateway, city-based agent matching, and the office check-in QR flow. The items below were found by checking
the actual code — each is either confirmed present or confirmed absent, not assumed.

## 🔴 Worth fixing before real founders rely on it

### Founders can't act on job applications

`JobApplication.status` exists and defaults to `PENDING`, but there is no endpoint or UI for a founder to mark
an applicant Reviewed, Accepted, or Rejected. Every application sits as `PENDING` indefinitely — founders have
to message candidates outside the platform. This is a real functional hole in the hiring pillar, one of the
three core pillars of the platform.

### No admin user management page

Queues exist for inspections, documents, and reports — but there is no page to list all users, search by email,
or suspend/ban an account from the UI. The only current option for abuse response is direct database access
via Prisma Studio.

### R2 file upload is untested on the actual Workers runtime

The upload pipeline uses `@aws-sdk/client-s3` against R2's S3-compatible endpoint via environment variables.
This works in local dev for certain. `wrangler.jsonc` has `nodejs_compat` enabled, which gives it a real
chance of working in production — but it has not been deployed and tested. AWS SDK v3 occasionally has
edge-runtime quirks even with compat flags on.

**Action:** test an actual photo upload on the deployed Workers environment before relying on it for a real
inspection.

**Fallback if it fails:** add a native `r2_buckets` binding to `wrangler.jsonc` and swap `storage.ts` to use
that binding instead of the S3 SDK — more reliable on Workers, but only works in production, not local dev.

## 🟡 Real gaps, lower urgency at current scale

- **No rate limiting on cofounders/events/press posting** — low risk with ~20 known founders, worth adding
  before public signups open.
- **Health Score has no explanation shown to the user** — a founder sees a number with no breakdown of what is
  pulling it down.
- **No "my activity" views** — RSVP'd events, mentor connections, and cofounder listing activity are
  write-only; nothing surfaces them back to the user.
- **Only two utility functions (`tokens.ts`, `badges.ts`) have tests.** Every API route and every React
  component has zero test coverage.
- **No accessibility pass** — no screen-reader testing, no keyboard-navigation audit.

## 🟢 Explicitly out of scope — correctly left alone

Payment gateway, city-based agent matching, and the office check-in QR flow were all explicitly deferred and
have not been touched.

## Bottom line

Nothing above blocks running Phase 1 as designed. The job-application status gap is the one worth fixing
soonest — "founder can't respond to an applicant" undermines the hiring pillar in a way the first 20 founders
will notice within a week. The R2-on-Workers risk is the one to verify, not necessarily fix — it may already
work as-is. Everything else is reasonable to defer until there are enough users to justify the effort.

---

## Status as of the v6.0.0 consolidated release

Most of the gaps above were closed during the build-out that followed this review:

| Gap | Status |
|-----|--------|
| R2 file upload untested on Workers | **Addressed** — `src/lib/storage.ts` now uses separate public/private R2 buckets with 5-minute signed URLs, and `@aws-sdk/s3-request-presigner` is a declared dependency. It still needs one real upload on the deployed runtime to confirm. |
| No admin user management page | **Addressed** — `/admin/users` with search, status and role assignment. |
| No rate limiting on cofounders/events/press posting | **Addressed** — `src/lib/rate-limit.ts` with a `RateLimit` table; sensitive operations fail closed. |
| Health Score has no explanation | **Partially addressed** — `src/lib/badges.ts` computes the score and the tier is displayed, but there is still no per-factor breakdown shown to the founder. |
| No "my activity" views | **Partially addressed** — `/dashboard/notifications` and the in-app bell surface activity, but there are no dedicated RSVP / mentor-connection / listing-activity views. |
| Test coverage limited to two utility modules | **Improved** — the suite is now 7 files / 50 cases covering `tokens`, `badges`, `file-signature`, `url-safety`, `jwt-security`, `permissions` and `approval-policy`. API routes and React components still have none. |
| No accessibility pass | **Still open.** |
| Founders can't act on job applications | **Still open** — `JobApplication.status` has no review endpoint or UI. |
| Payment gateway, city-based agent matching, office check-in QR flow | **Still out of scope** by decision. |
