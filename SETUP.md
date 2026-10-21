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
