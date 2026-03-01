import { describe, it, expect } from 'vitest';
import { AuthenticationError, ForbiddenError } from 'apollo-server-express';
import {
  requireAuth,
  requireRole,
  requireSameCountry,
  requireOwnerOrManager,
  requireCanModifyUser,
} from '../src/lib/permissions';
import type { AuthUser } from '../src/lib/auth';

const adminUser: AuthUser = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN', countryId: 'country-1' };
const managerUser: AuthUser = { id: 'manager-1', email: 'manager@test.com', role: 'MANAGER', countryId: 'country-1' };
const memberUser: AuthUser = { id: 'member-1', email: 'member@test.com', role: 'MEMBER', countryId: 'country-1' };
const otherCountryUser: AuthUser = { id: 'other-1', email: 'other@test.com', role: 'ADMIN', countryId: 'country-2' };

describe('requireAuth', () => {
  it('throws AuthenticationError when user is null', () => {
    expect(() => requireAuth(null)).toThrow(AuthenticationError);
  });

  it('does not throw when user is authenticated', () => {
    expect(() => requireAuth(adminUser)).not.toThrow();
  });
});

describe('requireRole', () => {
  it('throws ForbiddenError when role does not match', () => {
    expect(() => requireRole(memberUser, 'ADMIN')).toThrow(ForbiddenError);
    expect(() => requireRole(memberUser, 'MANAGER')).toThrow(ForbiddenError);
  });

  it('does not throw when role matches', () => {
    expect(() => requireRole(adminUser, 'ADMIN')).not.toThrow();
    expect(() => requireRole(managerUser, 'ADMIN', 'MANAGER')).not.toThrow();
    expect(() => requireRole(memberUser, 'ADMIN', 'MANAGER', 'MEMBER')).not.toThrow();
  });

  it('allows multiple valid roles', () => {
    expect(() => requireRole(adminUser, 'ADMIN', 'MANAGER')).not.toThrow();
  });
});

describe('requireSameCountry', () => {
  it('throws ForbiddenError when country does not match', () => {
    expect(() => requireSameCountry(memberUser, 'country-2')).toThrow(ForbiddenError);
  });

  it('does not throw when country matches', () => {
    expect(() => requireSameCountry(memberUser, 'country-1')).not.toThrow();
  });
});

describe('requireOwnerOrManager', () => {
  it('throws ForbiddenError when member tries to access another user\'s resource', () => {
    expect(() => requireOwnerOrManager(memberUser, 'other-user-id')).toThrow(ForbiddenError);
  });

  it('does not throw when member accesses their own resource', () => {
    expect(() => requireOwnerOrManager(memberUser, memberUser.id)).not.toThrow();
  });

  it('does not throw for admin accessing any resource', () => {
    expect(() => requireOwnerOrManager(adminUser, 'any-user-id')).not.toThrow();
  });

  it('does not throw for manager accessing any resource', () => {
    expect(() => requireOwnerOrManager(managerUser, 'any-user-id')).not.toThrow();
  });
});

describe('requireCanModifyUser', () => {
  it('throws ForbiddenError when manager tries to modify admin data', () => {
    expect(() => requireCanModifyUser(managerUser, 'ADMIN')).toThrow(ForbiddenError);
  });

  it('does not throw when admin modifies admin data', () => {
    expect(() => requireCanModifyUser(adminUser, 'ADMIN')).not.toThrow();
  });

  it('does not throw when admin or manager modifies member data', () => {
    expect(() => requireCanModifyUser(managerUser, 'MEMBER')).not.toThrow();
    expect(() => requireCanModifyUser(adminUser, 'MEMBER')).not.toThrow();
  });
});

describe('country isolation', () => {
  it('enforces country boundaries for cross-country access', () => {
    expect(() => requireSameCountry(memberUser, otherCountryUser.countryId)).toThrow(ForbiddenError);
  });
});
