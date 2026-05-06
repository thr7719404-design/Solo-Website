/**
 * Compute the effective status of a promo code from its DB row.
 * A promo is only truly "ACTIVE" when:
 *   - admin flag isActive = true, AND
 *   - current time is within [startsAt, expiresAt], AND
 *   - usageCount has not reached usageLimit (if set).
 */
export type PromoStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'EXHAUSTED'
  | 'SCHEDULED';

export interface PromoStatusInput {
  isActive: boolean;
  startsAt?: Date | string | null;
  expiresAt?: Date | string | null;
  usageLimit?: number | null;
  usageCount?: number | null;
}

export function computePromoStatus(p: PromoStatusInput, now: Date = new Date()): PromoStatus {
  if (!p.isActive) return 'INACTIVE';

  const expires = p.expiresAt ? new Date(p.expiresAt) : null;
  if (expires && expires.getTime() <= now.getTime()) return 'EXPIRED';

  if (p.usageLimit != null && (p.usageCount ?? 0) >= p.usageLimit) return 'EXHAUSTED';

  const starts = p.startsAt ? new Date(p.startsAt) : null;
  if (starts && starts.getTime() > now.getTime()) return 'SCHEDULED';

  return 'ACTIVE';
}
