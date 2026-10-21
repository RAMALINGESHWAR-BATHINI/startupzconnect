# StartupzConnect — Architecture

## Overview
StartupzConnect is a Next.js App Router application with a startup/community focus, featuring a five-role admin system, multi-device sessions, private document storage with signed URLs, and comprehensive security hardening.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Database:** SQLite (local dev), Cloudflare D1 (production via `@prisma/adapter-d1`)
- **ORM:** Prisma with driver adapters
- **Auth:** JWT (HS256) access + refresh tokens, bcrypt password hashing, per-device `Session` table
- **File Storage:** Cloudflare R2 (public + private buckets), short-lived signed URLs
- **Testing:** Vitest

## Directory Layout
```
src/
  app/
    api/auth/*          — Auth routes (login, register, refresh, password, etc.)
    api/admin/*         — Admin APIs (roles, users, grants, permissions, approvals, audit-logs, security, data, design, dev, settings)
    admin/*             — Admin dashboard pages
    startups/*          — Startup routes
    inspections/*       — Inspection report routes
  lib/
    auth.ts             — JWT sign/verify, token-purpose claims, secure cookies
    sessions.ts         — Multi-device session management (hashed refresh tokens)
    admin-auth.ts       — authorizeAdmin(): CSRF + token verify + DB role/permission check
    permissions.ts      — Permission registry (5 primary + 5 operational roles)
    rate-limit.ts       — Fixed-window rate limiter backed by RateLimit table
    file-signature.ts   — Magic-byte MIME verification vs client-declared type
    storage.ts          — R2 public/private buckets, signed URLs, upload validation
    tokens.ts           — Token generation + bcrypt hashing for single-use tokens
    csrf-core.ts        — CSRF origin/referer checks
    turnstile.ts        — Cloudflare Turnstile verification
    url-safety.ts       — URL safety checks
    redact.ts           — Metadata redaction for audit logs
    guards.ts           — Email verification / active status guards
  context/
    AuthContext.tsx     — Client-side auth context (server-trusted roles only)

## Security Principles
- Deny-by-default authorization; no inheritance; no client-trusted roles
- Token-purpose claims prevent access/refresh token swapping
- Algorithm pinned to HS256; `alg:none` rejected
- Refresh tokens hashed before storage; per-device sessions with individual revocation
- CSRF on all unsafe methods; Turnstile on register + forgot-password
- Rate limiting per-email + per-IP, fail closed on DB error for sensitive ops
- Append-only AuditLog + SiteSettingHistory (DB-enforced triggers)
- Private documents served via 5-minute signed URLs only