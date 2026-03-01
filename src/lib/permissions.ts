import { ForbiddenError, AuthenticationError } from 'apollo-server-express';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  countryId: string;
}

type Role = 'ADMIN' | 'MANAGER' | 'MEMBER';

// Policy-based permission helpers
export function requireAuth(user: AuthUser | null): asserts user is AuthUser {
  if (!user) throw new AuthenticationError('Not authenticated');
}

export function requireRole(user: AuthUser, ...roles: Role[]): void {
  if (!(roles as string[]).includes(user.role)) {
    throw new ForbiddenError(`Requires one of roles: ${roles.join(', ')}`);
  }
}

export function requireNotRole(user: AuthUser, ...roles: Role[]): void {
  if ((roles as string[]).includes(user.role)) {
    throw new ForbiddenError('Insufficient permissions for this action');
  }
}

export function requireSameCountry(user: AuthUser, resourceCountryId: string): void {
  if (user.countryId !== resourceCountryId) {
    throw new ForbiddenError('Access denied: Resource outside your country');
  }
}

export function requireOwnerOrManager(user: AuthUser, ownerId: string): void {
  if (user.id !== ownerId && user.role === 'MEMBER') {
    throw new ForbiddenError('Access denied: You can only modify your own resources');
  }
}

// Admins cannot be modified by non-admins
export function requireCanModifyUser(actor: AuthUser, targetRole: string): void {
  if (targetRole === 'ADMIN' && actor.role !== 'ADMIN') {
    throw new ForbiddenError('Only Admins can modify Admin data');
  }
}
