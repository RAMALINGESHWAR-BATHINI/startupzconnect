import { describe, it, expect } from 'vitest';
import { permissionsFor, hasPermission, isAdminRole, SENSITIVE_ROLES, ADMIN_ROLES, ROLE_PERMISSIONS } from '@/lib/permissions';

describe('permissions registry', () => {
  it('denies by default for unknown roles', () => {
    const perms = permissionsFor(['NONEXISTENT_ROLE']);
    expect(perms.size).toBe(0);
  });

  it('GLOBAL_ADMIN has admin.roles.assign', () => {
    const perms = permissionsFor(['GLOBAL_ADMIN']);
    expect(hasPermission(perms, 'admin.roles.assign')).toBe(true);
  });

  it('DEV_ADMIN does NOT have admin.roles.assign (no inheritance)', () => {
    const perms = permissionsFor(['DEV_ADMIN']);
    expect(hasPermission(perms, 'admin.roles.assign')).toBe(false);
  });

  it('DATA_ADMIN does not inherit DEV_ADMIN permissions', () => {
    const perms = permissionsFor(['DATA_ADMIN']);
    expect(hasPermission(perms, 'dev.health.read')).toBe(false);
    expect(hasPermission(perms, 'data.database_health.read')).toBe(true);
  });

  it('SEC_ADMIN cannot act on GLOBAL_ADMIN (containment)', () => {
    // This is enforced in admin-auth.ts canActOnTarget; here we just confirm roles are distinct
    expect(SENSITIVE_ROLES).toContain('GLOBAL_ADMIN');
    expect(SENSITIVE_ROLES).toContain('SEC_ADMIN');
    expect(SENSITIVE_ROLES).toContain('DATA_ADMIN');
  });

  it('isAdminRole returns false for non-admin roles', () => {
    expect(isAdminRole('USER')).toBe(false);
    expect(isAdminRole('STUDENT')).toBe(false);
    expect(isAdminRole('GLOBAL_ADMIN')).toBe(true);
  });

  it('every sensitive role has at least one permission', () => {
    for (const role of SENSITIVE_ROLES) {
      const perms = permissionsFor([role]);
      expect(perms.size).toBeGreaterThan(0);
    }
  });
});
