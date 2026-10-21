/**
 * Centralized server-side authorization for admin operations.
 *
 * `authorizeAdmin(request, permission)`:
 *  1. CSRF check for unsafe methods (Origin / Sec-Fetch-Site / Referer).
 *  2. Verify access token (algorithm-pinned, purpose-checked).
 *  3. Load user from DB (status, emailVerified).
 *  4. Reject if account not ACTIVE or email unverified.
 *  5. Load AdminRoleAssignment rows from DB (never trust client/token roles).
 *  6. Compute permissions via permissionsFor(); missing permission → AUTHZ_FAILURE audit + 403.
 *  7. For sensitive actions, require current password (per-user rate limited).
 *
 * Deny by default. All authorization decisions are server-side.
 */

import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyTokenPurpose } from '@/lib/auth';
import { permissionsFor, hasPermission, isAdminRole, canActOnTarget, type Permission } from '@/lib/permissions';
import { checkCsrf } from '@/lib/csrf-core';
import { redactValue, serializeMetadata } from '@/lib/redact';
import { consume, authKey } from '@/lib/rate-limit';

export interface AdminActor {
  userId: number;
  email: string;
  roles: string[];
  permissions: Set<Permission>;
}

export interface AuthorizeOpts {
  permission: Permission;
  sensitive?: boolean; // requires current password + rate limit
  targetUserId?: number; // for containment checks (canActOnTarget)
  targetRoles?: string[]; // roles of the target user
}

/** Write an audit record (best-effort; never blocks the response). */
export async function auditLog({
  actorId,
  actorLabel,
  category,
  action,
  severity = 'INFO',
  outcome = 'SUCCESS',
  targetType,
  targetId,
  ip,
  metadata,
}: {
  actorId?: number;
  actorLabel?: string;
  category: string;
  action: string;
  severity?: string;
  outcome?: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  metadata?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        category,
        action,
        severity,
        outcome,
        actorId,
        actorLabel,
        targetType,
        targetId: targetId ? String(targetId) : null,
        ip,
        metadata: metadata ? serializeMetadata(metadata) : null,
      },
    });
  } catch {
    // Audit writes must never break the auth flow.
  }
}

export async function authorizeAdmin(req: NextRequest, opts: AuthorizeOpts): Promise<{ actor: AdminActor } | NextResponse> {
  const ip =
    req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? undefined;

  // 1. CSRF for unsafe methods.
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const csrf = checkCsrf({
      method: req.method,
      origin: req.headers.get('origin') ?? null,
      referer: req.headers.get('referer') ?? null,
      host: req.headers.get('host') ?? null,
      secFetchSite: req.headers.get('sec-fetch-site') ?? null,
      requestUrl: req.url,
    });
    if (!csrf.ok) {
      await auditLog({
        category: 'AUTHZ_FAILURE',
        action: 'csrf.rejected',
        severity: 'WARN',
        outcome: 'DENIED',
        ip,
        metadata: { reason: csrf.reason },
      });
      return NextResponse.json({ error: 'CSRF check failed.' }, { status: 403 });
    }
  }

  // 2. Verify access token.
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) {
    await auditLog({ category: 'AUTHZ_FAILURE', action: 'admin.no_token', severity: 'WARN', outcome: 'DENIED', ip });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const decoded = verifyAccessToken(token) as any;
  if (!decoded) {
    await auditLog({ category: 'AUTHZ_FAILURE', action: 'admin.invalid_token', severity: 'WARN', outcome: 'DENIED', ip });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Token-purpose validation: access tokens must have purpose 'access'.
  if (!verifyTokenPurpose(decoded, 'access')) {
    await auditLog({
      category: 'AUTHZ_FAILURE',
      action: 'admin.bad_token_purpose',
      severity: 'HIGH',
      outcome: 'DENIED',
      actorId: decoded.id,
      ip,
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. Load user from DB.
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, name: true, status: true, emailVerified: true },
  });
  if (!user) {
    await auditLog({ category: 'AUTHZ_FAILURE', action: 'admin.user_not_found', severity: 'WARN', outcome: 'DENIED', actorId: decoded.id, ip });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 4. Reject suspended / unverified accounts.
  if (user.status !== 'ACTIVE') {
    await auditLog({
      category: 'AUTHZ_FAILURE',
      action: 'admin.account_not_active',
      severity: 'HIGH',
      outcome: 'DENIED',
      actorId: user.id,
      ip,
      metadata: { status: user.status },
    });
    return NextResponse.json({ error: 'Account is not active.' }, { status: 403 });
  }
  if (!user.emailVerified) {
    await auditLog({
      category: 'AUTHZ_FAILURE',
      action: 'admin.email_not_verified',
      severity: 'WARN',
      outcome: 'DENIED',
      actorId: user.id,
      ip,
    });
    return NextResponse.json({ error: 'Email not verified.' }, { status: 403 });
  }

  // 5. Load admin role assignments from DB (never trust token/client roles).
  const assignments = await prisma.adminRoleAssignment.findMany({
    where: { userId: user.id },
    select: { role: true },
  });
  const roles = assignments.map((a: any) => a.role).filter((r: any): r is string => isAdminRole(r));

  if (roles.length === 0) {
    await auditLog({
      category: 'AUTHZ_FAILURE',
      action: 'admin.no_admin_role',
      severity: 'WARN',
      outcome: 'DENIED',
      actorId: user.id,
      ip,
      metadata: { requestedPermission: opts.permission },
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 6. Permission check (deny by default).
  const permissions = permissionsFor(roles);
  if (!hasPermission(permissions, opts.permission)) {
    await auditLog({
      category: 'AUTHZ_FAILURE',
      action: `admin.permission_denied:${opts.permission}`,
      severity: 'HIGH',
      outcome: 'DENIED',
      actorId: user.id,
      ip,
      metadata: { roles, requestedPermission: opts.permission },
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 7. Containment check: cannot act on a GLOBAL_ADMIN unless you are one too.
  if (opts.targetUserId && opts.targetRoles && opts.targetRoles.includes('GLOBAL_ADMIN') && !roles.includes('GLOBAL_ADMIN')) {
    await auditLog({
      category: 'AUTHZ_FAILURE',
      action: 'admin.containment_violation',
      severity: 'HIGH',
      outcome: 'DENIED',
      actorId: user.id,
      ip,
      metadata: { targetUserId: opts.targetUserId },
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 8. Sensitive actions: require current password + per-user rate limit.
  if (opts.sensitive) {
    const rl = await consume(authKey(String(user.id), ip ?? null, 'sensitive-admin'), {
      failClosed: true,
      limit: 5,
      windowSeconds: 60 * 15,
    });
    if (!rl.allowed) {
      await auditLog({
        category: 'AUTHZ_FAILURE',
        action: 'admin.sensitive_rate_limited',
        severity: 'WARN',
        outcome: 'DENIED',
        actorId: user.id,
        ip,
      });
      return NextResponse.json(
        { error: 'Too many sensitive attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds ?? 900) } }
      );
    }
    // The caller must have verified the current password separately before reaching here;
    // we enforce rate limiting here and expect the route to confirm password possession.
  }

  return {
    actor: {
      userId: user.id,
      email: user.email,
      roles,
      permissions,
    },
  };
}

/** Helper for routes that need the current password for sensitive operations. */
export async function verifyCurrentPassword(userId: number, currentPassword: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user?.password) return false;
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(currentPassword, user.password);
}
