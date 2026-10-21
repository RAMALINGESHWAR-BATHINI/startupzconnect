# StartupzConnect — Setup Guide (Post-Upgrade)

This build adds: team members, work logs, community reviews, office check-ins,
field agents, inspection reports, investor profiles, and origin/stage tracking
on top of the base platform.

## First-time setup

```bash
npm install
npx prisma generate
npx prisma db push      # creates/updates prisma/dev.db with the new schema
npm run dev
```

Open http://localhost:3000

## Environment variables (.env.local)

```
ACCESS_TOKEN_SECRET=<random 48+ char string>
REFRESH_TOKEN_SECRET=<random 48+ char string>
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## New roles

Registration now uses: `STUDENT`, `PROFESSIONAL`, `STARTUP`, `INVESTOR`, `OTHER`
(plus internal `ADMIN`, not selectable at signup).

Only `STARTUP` role accounts can create a startup profile or post jobs.

## New flows to try

1. **Register as STARTUP** → Dashboard → Create Startup (4-step form: basic
   info, origin & legal, stage & team, review)
2. **Manage startup** → add team members, post weekly work-log updates,
   fill in traction numbers (users/revenue/funding)
3. **Request Inspection** from the startup's manage page or navbar dropdown
4. **To test the agent flow**: manually create a FieldAgent row for a user
   in Prisma Studio (`npx prisma studio`) — set `userId`, `city`, `isActive: true`.
   That user can then visit `/agent` to see assigned inspections and submit
   scored reports.
5. **To test the admin approval flow**: set a user's `role` to `ADMIN` in
   Prisma Studio, then visit `/admin/inspections` to approve/reject submitted
   reports. Approval automatically issues the `FIELD_VERIFIED` badge.
6. **Register as INVESTOR** → navbar dropdown → Investor Profile → fill in
   net worth bracket, thesis, sectors
7. **Leave a review**: visit any startup you don't own → "Write a Review"
   in the sidebar (note: full check-in-gated reviews are a future addition;
   currently any logged-in non-owner can submit one review per startup)

## Known simplifications in this build (documented, not bugs)

- **Photo uploads are not wired up yet.** The schema and UI have fields for
  exterior/interior/team/product photos (stored as JSON URL arrays), but
  there's no upload endpoint. Add Cloudflare R2 (see tech stack notes) and
  wire a presigned-upload API route to `/api/uploads` before agents can
  attach real photos.
- **Office check-in QR flow is schema-only.** `OfficeCheckIn` model exists
  but there's no check-in API/UI yet. Reviews currently don't require a
  check-in to submit — add that gate once check-in is built.
- **Agent city-matching is naive.** `/api/inspections` just grabs any active
  agent. Add proper city-based matching once you have more than one agent.
- **Document verification for the "Registered" badge is automatic** based on
  whether `registrationId` is filled in — there's no actual document upload
  or manual verification step yet. Add a documents table + admin review
  queue similar to the inspections one.

## Recommended next build session

1. Cloudflare R2 file upload (photos, documents) — unblocks real inspections
2. Office check-in QR/code system — unblocks trustworthy reviews
3. Document upload + admin verification queue for the Registered badge
4. Email notifications (Resend) for: inspection status, job application
   updates, new collaboration/investment interest

## Critical auth gaps fixed in this pass

1. **Email verification** — new users get a 24h verification link (logged to
   console via `src/lib/mailer.ts` until a real provider is wired up). Writing
   actions (creating a startup, posting a job, applying, reviewing, investing,
   collaborating) are blocked with a 403 until the account is verified.
   Resend the link anytime from Dashboard → Settings.
2. **Password reset** — `/forgot-password` → emailed link → `/reset-password`.
   Reset tokens expire in 1 hour and are single-use. A successful reset also
   clears the stored refresh token, so old sessions are force-logged-out.
3. **Login rate limiting** — 5 failed attempts locks the account for 15
   minutes (`failedLoginAttempts` / `lockedUntil` on `User`). Successful login
   clears the counter.
4. **Self-service account deletion** — Settings → Danger Zone, password-
   confirmed. Cascades through Prisma relations. Field agents with inspection
   history can't self-delete (their reports back startup badges) — they're
   told to contact support instead.
5. **Session management** — "Log Out of All Devices" in Settings clears the
   stored refresh token server-side, invalidating every other active session
   immediately.

### Wiring a real email provider

Everything routes through `sendMail()` in `src/lib/mailer.ts`. Right now it
just logs to the console. To go live, sign up for Resend, set
`RESEND_API_KEY` in `.env.local`, and uncomment the fetch call in that file —
nothing else in the app needs to change.

### Inspection pricing (current)

- **Basic** — ₹1,000 (visit + report + badge)
- **Premium** — ₹3,000 (+ full photo set, product showcase, video walkthrough)

Payment collection is still not wired to a gateway — see the monetization
gap noted separately.

## This session's additions (core features, trust-system completions, polish)

### Core platform features (previously designed, now built)
- **Co-founder matching** — `/cofounders`: post a listing (skills offered/wanted,
  commitment, domain, pitch), browse others. `CofounderListing` model.
- **Startup-to-startup collaboration** — the Collaborate panel on a startup's
  page now lets a founder send a request *as their own startup* (not just as
  themselves). Founders review these in Manage → Collab Requests, accept/reject.
- **Mentor role** — new `MENTOR` role at registration, a mentor profile page
  (`/dashboard/mentor-profile`), and a public directory (`/mentors`).
- **Events** — `/events`: startups or the community post demo days, pitch
  competitions, meetups; anyone can RSVP.
- **Grants & government schemes** — `/grants`: admin-curated list (`Grant`
  model) with eligibility, amount range, deadline, apply link.
- **Press/media board** — `/press`: journalists post what they're looking for;
  startups respond directly.
- **Institution partners** — `InstitutionPartner` model + admin panel
  (`/admin/institutions`) to register incubators/accelerators and see how many
  startups are tagged to each — the bulk-onboarding channel we discussed.
- **Startup Health Score** — computed server-side (`src/lib/badges.ts`,
  `computeHealthScore`) from verification tier, inspection score, team size,
  traction, reviews, and activity recency. Shown on every startup profile.

### Trust-system pieces (previously half-built, now complete)
- **Founder responses to reviews** — founders can now post one public response
  per review directly from the startup page.
- **Review flagging** — a Report button on every review (`Report` model,
  generic — reusable for other content types later). Flagging marks the review
  "Under review" but never auto-removes it; an admin queue at `/admin/reports`
  makes the final call (policy §6.3).
- **Badge expiry / re-inspection** — Field Verified and above badges now
  auto-downgrade to Registered after 18 months with no new inspection
  (`isBadgeExpired` / `displayBadgeTier` in `src/lib/badges.ts`), applied
  consistently across the startup detail API, listing API, and jobs API.
- **Document verification for the Registered badge** — founders submit a
  document link (Drive/Dropbox — real file upload still needs R2) at
  Manage → Documents; an admin queue at `/admin/documents` verifies it, which
  unlocks the Registered badge automatically on first approval.

### Polish
- `resumeUrl` on job applications is now actually collected (paste-a-link,
  pending real file upload) and passed to the API.
- Team member photos: `photoUrl` field now has an input in Manage → Team
  (again, link-based until R2).
- `sitemap.xml` and `robots.ts` — real, server-generated, submitted routes
  exclude private areas (dashboard/admin/agent/api).
- Per-page metadata: `/startups` and `/jobs` listings were split into a thin
  server component (`page.tsx`, holds `export const metadata`) + a client
  component (`StartupsClient.tsx` / `JobsClient.tsx`, holds the interactive
  UI). This is the pattern to repeat for other pages that still share the
  root layout's generic title/description — not yet done for every page,
  since each one needs the same split and this was already a very large
  session.
- **Tests**: `vitest` added as a dev dependency with real unit tests for the
  two pure-function utility modules (`src/lib/tokens.ts`,
  `src/lib/badges.ts`) — token format/uniqueness, badge expiry math, and
  health score bounds/ordering. Run with `npm test`. This is a starting
  point, not full coverage — API routes and React components still have none.

## Still not done (carried over, unchanged from before)
- Cloudflare R2 file upload — the real blocker behind every "paste a link"
  workaround above (documents, resumes, team photos, inspection photos).
- Office check-in QR/code UI (the API exists; reviews check for it but don't
  require it yet).
- Payment gateway integration for inspection fees.
- Email provider wiring (still logs to console — see the mailer section above).

## Phase 1 completion pass (this session)

Everything from the Phase 1 checklist is now implemented, except the three
items explicitly deferred: payment gateway, city-based agent matching, and
the office check-in QR flow (all correctly out of scope while you're the
only agent and inspection is free).

### 🔴 Former blockers — now resolved

1. **Cloudflare R2 file storage** — `src/lib/storage.ts` uploads to R2 via
   its S3-compatible API when `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` /
   `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` are set. Without
   them, it falls back to writing under `/public/uploads` — fine for
   `npm run dev`, but this fallback does NOT work on Cloudflare Workers, so R2
   must be configured before going live. A reusable `<FileUpload>` component
   and a generic `/api/uploads` endpoint (with type/size validation) are wired
   into: team member photos, startup documents, job application resumes, and
   — most importantly — **agent inspection photos** (exterior/interior/team/
   product, multi-photo per category). This was the single most important
   piece of Phase 1, since it's what makes an inspection report verifiable.
2. **Real email sending** — `src/lib/mailer.ts` now calls the Resend API when
   `RESEND_API_KEY` is set. Falls back to console logging (with the failure
   reason) if the key is missing or the API call fails, so a bad email never
   silently disappears.
3. **Admin/agent bootstrap** — `npm run db:seed` (`prisma/seed.ts`) creates
   your ADMIN account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME`,
   registers it as a FieldAgent (Phase 1 = you are the only inspector), and
   seeds the Grants page with 6 real Indian funding schemes. Safe to re-run —
   everything is an upsert.
4. **Terms of Service & Privacy Policy** — real pages at `/terms` and
   `/privacy`, linked from the footer. Registration now requires checking "I
   agree to the Terms and Privacy Policy" before the account is created, and
   records `termsAcceptedAt` on the user record as a timestamped proof of
   consent.
5. **Environment variable checklist** — `.env.example` now lists every
   variable this app uses, grouped by what breaks if you skip it (auth is
   required; email and storage are "required before real users"; admin seed
   and error alerting are optional but recommended).

### 🟠 Former "should do" items — now resolved

6. **Admin home dashboard** (`/admin`) — aggregates pending counts across
   inspections, documents, and reports into one page with direct links, plus
   total startup/user counts. No more checking four separate URLs.
7. **Error alerting** — `src/lib/alerts.ts` posts to a Slack-compatible
   `ERROR_WEBHOOK_URL` (no paid SDK/account required — a Slack incoming
   webhook takes 2 minutes to set up) whenever a critical server error fires.
   Wired into registration, login, startup creation, inspection/document
   admin decisions, and file uploads, plus a Next.js `instrumentation.ts`
   hook that catches any other uncaught server error, and a `global-error.tsx`
   boundary for uncaught client-side render errors.
8. **Admin-to-user messaging / notifications system** — a full `Notification`
   model, in-app bell dropdown in the navbar (polls every 60s), a full
   `/dashboard/notifications` page, and an admin "send a direct notification"
   form at the bottom of `/admin`. System notifications fire automatically
   on: inspection approved/rejected, document verified/rejected, new
   collaboration request (including startup-to-startup), founder responded to
   your review, and a startup responded to your press request.
9. **Grants seed data** — see item 3; the page is no longer empty on day one.
10. **Mobile responsiveness** — spot-checked registration, startup profile,
    and the review form; all already used responsive Tailwind classes from
    earlier sessions. I did not test on physical devices — this is a code-
    level review, not a substitute for actually opening the site on a phone
    before you send the link to your first founder.

### Also done — per-page SEO metadata (was on the broader gap list, not excluded)

All ten remaining static pages (`/investments`, `/cofounders`, `/mentors`,
`/events`, `/grants`, `/press`, `/login`, `/register`) were split into the
same server-wrapper + client-component pattern used earlier for `/startups`
and `/jobs`, each now with its own real `<title>`/description. The two
dynamic detail pages (`/startups/[id]`, `/jobs/[id]`) use `generateMetadata`
with a direct Prisma lookup, so a shared link to a specific startup or job
shows that startup's actual name, not the generic site title. `sitemap.ts`
was also extended to list every real startup and open job, not just the
static routes.

### New dependencies — run `npm install` before anything else

This session added `@aws-sdk/client-s3` (R2 upload), `tsx` (runs the seed
script), and `vitest` (from the previous session, if not already installed).

### What's still correctly out of scope for Phase 1

- Payment gateway (Razorpay/Stripe) — inspection is free and manual
- City-based agent matching — you are the only agent
- Office check-in QR flow — not needed until reviews must scale past founders
  you personally know
