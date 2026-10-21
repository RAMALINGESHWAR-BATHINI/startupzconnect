# StartupzConnect — Security Policies

## Authentication
- Access tokens: 15-minute expiry, HS256, purpose claim `access`
- Refresh tokens: 7-day expiry, HS256, purpose claim `refresh`, hashed before storage
- Token rotation on every refresh; reuse detection revokes all sessions for the user
- Password change invalidates all other sessions
- Login lockout after 5 failed attempts (15-minute lock)

## Authorization
- Deny-by-default; no inheritance; no client-trusted roles
- Admin authorization reads role assignments from DB on every request
- Email verification required for all accounts (including admins) before privileged actions
- Suspended accounts rejected
- Sensitive actions require current password + per-user rate limiting

## CSRF
- Origin / Sec-Fetch-Site / Referer checks on all unsafe methods (POST, PUT, DELETE, PATCH)
- SameSite=Strict on all auth cookies

## Rate Limiting
- Fixed-window counters backed by database `RateLimit` table
- Per-email + per-IP composite keys
- Fail closed on DB error for sensitive operations
- Login, register, forgot-password, resend-verification, sensitive admin ops

## File Uploads
- Magic-byte verification vs client-declared MIME type
- Dangerous extensions blocked (SVG, HTML in sensitive folders)
- Size limits: 5MB images, 10MB documents
- Private bucket for documents/resumes/inspections; no permanent public URLs
- 5-minute signed URLs for private object access

## Content Security Policy
- default-src 'self'; script-src 'self' + unsafe-inline (temporary) + Turnstile
- object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
- HSTS in production; R2 public domain in img-src/connect-src
- unsafe-inline retained temporarily as compatibility debt

## Audit
- Append-only AuditLog and SiteSettingHistory (DB triggers refuse UPDATE/DELETE)
- All admin actions audited with actor, action, severity, outcome, IP, redacted metadata
- AUTHZ_FAILURE events logged at WARN/HIGH severity