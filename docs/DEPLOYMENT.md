# StartupzConnect — Deployment

## Prerequisites
- Node.js 20+, npm
- Cloudflare account (for D1, R2, Turnstile, Workers)
- Resend account (for email)
- `.env.local` populated from `.env.example` (never commit real secrets)

## Required Environment Variables
| Variable | Purpose |
|----------|---------|
| ACCESS_TOKEN_SECRET | JWT access token signing (min 64 chars random) |
| REFRESH_TOKEN_SECRET | JWT refresh token signing (min 64 chars random) |
| NEXT_PUBLIC_API_URL | Deployment URL (no trailing slash) |
| RESEND_API_KEY | Email sending |
| RESEND_FROM_EMAIL | From address |
| R2_ACCOUNT_ID | Cloudflare R2 account ID |
| R2_ACCESS_KEY_ID | R2 S3-compatible access key |
| R2_SECRET_ACCESS_KEY | R2 secret key |
| R2_PUBLIC_BUCKET_NAME | Public bucket name |
| R2_PRIVATE_BUCKET_NAME | Private bucket name |
| R2_PUBLIC_URL | Public R2 URL (e.g. https://assets.example.com) |
| TURNSTILE_SITE_KEY | Cloudflare Turnstile site key |
| TURNSTILE_SECRET_KEY | Cloudflare Turnstile secret key |
| ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME | Bootstrap admin (seed only) |
| ERROR_WEBHOOK_URL | Optional Slack webhook for error alerts |

## Deploy Steps
1. Run `0003_admin_system.sql` migration on staging; verify
2. Apply migration to production (with approval)
3. `npm run db:seed` to bootstrap admin account
4. Deploy code (new code ignores legacy `role='ADMIN'`)
5. Verify admin dashboard loads and role assignments work

## Cloudflare Configuration
- D1 database bound as `DB`
- R2 buckets: public + private
- Turnstile: site key + secret key from Cloudflare dashboard
- WAF, edge rate limits, TLS (recommended, optional extra layer)
- Cloudflare Access for admin infra (optional, not a replacement for app auth)

## Rollback
Restore D1 export / time travel. New columns/tables harmless to old code.