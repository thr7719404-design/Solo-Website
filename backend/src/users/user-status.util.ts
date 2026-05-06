/**
 * Compute the effective status of a user / customer account.
 *
 * Combines `isActive` (admin disable flag) and `emailVerified` so that the
 * admin UI never shows an unverified account as "Active".
 */
export type UserStatus = 'ACTIVE' | 'UNVERIFIED' | 'INACTIVE';

export interface UserStatusInput {
  isActive?: boolean | null;
  emailVerified?: boolean | null;
}

export function computeUserStatus(user: UserStatusInput): UserStatus {
  if (user.isActive === false) return 'INACTIVE';
  if (user.emailVerified === false) return 'UNVERIFIED';
  return 'ACTIVE';
}
