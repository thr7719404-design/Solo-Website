/**
 * Compute the effective status of an announcement.
 *
 * Mirrors PromoCode/Banner status logic so the admin UI can render a single
 * pill that always matches reality.
 */
export type AnnouncementStatus = 'LIVE' | 'SCHEDULED' | 'EXPIRED' | 'INACTIVE';

export interface AnnouncementStatusInput {
  isActive: boolean;
  startsAt?: Date | string | null;
  expiresAt?: Date | string | null;
  promoCode?: {
    isActive: boolean;
    startsAt?: Date | string | null;
    expiresAt?: Date | string | null;
  } | null;
}

export function computeAnnouncementStatus(
  a: AnnouncementStatusInput,
  now: Date = new Date(),
): AnnouncementStatus {
  if (!a.isActive) return 'INACTIVE';
  const start = a.startsAt ? new Date(a.startsAt) : null;
  const end = a.expiresAt ? new Date(a.expiresAt) : null;
  if (start && start > now) return 'SCHEDULED';
  if (end && end < now) return 'EXPIRED';
  // If linked to a promo, the announcement can't be live unless the promo is.
  if (a.promoCode) {
    if (!a.promoCode.isActive) return 'INACTIVE';
    const pStart = a.promoCode.startsAt ? new Date(a.promoCode.startsAt) : null;
    const pEnd = a.promoCode.expiresAt ? new Date(a.promoCode.expiresAt) : null;
    if (pStart && pStart > now) return 'SCHEDULED';
    if (pEnd && pEnd < now) return 'EXPIRED';
  }
  return 'LIVE';
}
