/**
 * Compute the effective lifecycle status of a banner.
 *
 * A banner can have `isActive` set to true but still not be live because the
 * scheduling window (startAt/endAt) hasn't begun, or has already ended.
 * Returning a single computed status keeps the admin UI honest.
 */
export type BannerStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'INACTIVE';

export interface BannerStatusInput {
  isActive: boolean;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
}

export function computeBannerStatus(
  banner: BannerStatusInput,
  now: Date = new Date(),
): BannerStatus {
  if (!banner.isActive) return 'INACTIVE';
  const start = banner.startAt ? new Date(banner.startAt) : null;
  const end = banner.endAt ? new Date(banner.endAt) : null;
  if (start && start > now) return 'SCHEDULED';
  if (end && end < now) return 'EXPIRED';
  return 'ACTIVE';
}
