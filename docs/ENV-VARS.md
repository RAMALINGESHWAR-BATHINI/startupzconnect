# StartupzConnect — Environment Variables

## Required
| Variable | Description | Example |
|----------|-------------|---------|
| ACCESS_TOKEN_SECRET | JWT access token signing secret | `openssl rand -base64 64` |
| REFRESH_TOKEN_SECRET | JWT refresh token signing secret | `openssl rand -base64 64` |
| NEXT_PUBLIC_API_URL | Deployment URL (no trailing slash) | `https://app.startupzconnect.com` |

## Email (Resend)
| Variable | Description |
|----------|-------------|
| RESEND_API_KEY | Resend API key |
| RESEND_FROM_EMAIL | From address (e.g. `StartupzConnect <noreply@example.com>`) |

## File Storage (Cloudflare R2)
| Variable | Description |
|----------|-------------|
| R2_ACCOUNT_ID | Cloudflare account ID |
| R2_ACCESS_KEY_ID | R2 S3-compatible access key |
| R2_SECRET_ACCESS_KEY | R2 secret key |
| R2_PUBLIC_BUCKET_NAME | Public bucket (branding, photos) |
| R2_PRIVATE_BUCKET_NAME | Private bucket (documents, resumes, inspections) |
| R2_PUBLIC_URL | Public R2 URL (e.g. `https://assets.example.com`) |

## Security (Cloudflare Turnstile)
| Variable | Description |
|----------|-------------|
| TURNSTILE_SITE_KEY | Turnstile site key (client-side) |
| TURNSTILE_SECRET_KEY | Turnstile secret key (server-side, never exposed) |

## Admin Bootstrap (Seed Only)
| Variable | Description |
|----------|-------------|
| ADMIN_EMAIL | Bootstrap admin email |
| ADMIN_PASSWORD | Bootstrap admin password |
| ADMIN_NAME | Bootstrap admin name |

## Optional
| Variable | Description |
|----------|-------------|
| ERROR_WEBHOOK_URL | Slack webhook for error alerts |
| DB | Cloudflare D1 binding (set automatically in Workers env) |

## Security Notes
- Never commit `.env.local` or any file containing real secrets
- Use `.env.example` as the template; populate `.env.local` locally
- Rotate `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` periodically
- `TURNSTILE_SECRET_KEY` must never be exposed to the client