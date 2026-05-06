/**
 * Compute the effective availability of a product based on the combination of
 * admin flags (isActive, isDiscontinued) and stock level.
 *
 * Frontend should never combine these flags on its own — that risks the cart
 * page showing a different state than the catalog or admin list.
 */
export type ProductAvailability =
  | 'AVAILABLE'
  | 'OUT_OF_STOCK'
  | 'DISCONTINUED'
  | 'INACTIVE';

export interface ProductAvailabilityInput {
  isActive?: boolean | null;
  isDiscontinued?: boolean | null;
  stockQty?: number | null;
}

export function computeProductAvailability(
  product: ProductAvailabilityInput,
): ProductAvailability {
  if (product.isActive === false) return 'INACTIVE';
  if (product.isDiscontinued === true) return 'DISCONTINUED';
  if ((product.stockQty ?? 0) <= 0) return 'OUT_OF_STOCK';
  return 'AVAILABLE';
}

/**
 * Map availability into the legacy admin "status" string the products page
 * already understands (active | draft | archived | out-of-stock).
 */
export function availabilityToAdminStatus(
  a: ProductAvailability,
): 'active' | 'draft' | 'archived' | 'out-of-stock' {
  switch (a) {
    case 'INACTIVE':
      return 'draft';
    case 'DISCONTINUED':
      return 'archived';
    case 'OUT_OF_STOCK':
      return 'out-of-stock';
    default:
      return 'active';
  }
}
