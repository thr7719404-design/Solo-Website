// ============================================================================
// Content / CMS Types — Banners, Landing Pages, Sections
// Matches NestJS backend /content/*
// ============================================================================

// -- Banner placements --------------------------------------------------------

export const BannerPlacement = {
  HOME_HERO: 'HOME_HERO',
  HOME_MID: 'HOME_MID',
  HOME_SECONDARY: 'HOME_SECONDARY',
  CATEGORY_TOP: 'CATEGORY_TOP',
  CATEGORY_MID: 'CATEGORY_MID',
  CATEGORY: 'CATEGORY',
  PRODUCT_SIDEBAR: 'PRODUCT_SIDEBAR',
  PRODUCT_DETAIL: 'PRODUCT_DETAIL',
  CHECKOUT_TOP: 'CHECKOUT_TOP',
  CHECKOUT: 'CHECKOUT',
  CART_SIDEBAR: 'CART_SIDEBAR',
  PROMOTION: 'PROMOTION',
} as const;

export type BannerPlacementType = (typeof BannerPlacement)[keyof typeof BannerPlacement];

// -- Landing section types ----------------------------------------------------

export const LandingSectionType = {
  // Porto-style homepage
  HERO: 'HERO',
  HERO_SLIDER: 'HERO_SLIDER',
  TOP_PROMO_BAR: 'TOP_PROMO_BAR',
  TOP_LINKS_BAR: 'TOP_LINKS_BAR',
  MAIN_HEADER: 'MAIN_HEADER',
  PRIMARY_NAV: 'PRIMARY_NAV',
  VALUE_PROPS_ROW: 'VALUE_PROPS_ROW',
  CATEGORY_TILES: 'CATEGORY_TILES',
  CATEGORY_GRID: 'CATEGORY_GRID',
  CATEGORY_CIRCLE_STRIP: 'CATEGORY_CIRCLE_STRIP',
  PRODUCT_CAROUSEL: 'PRODUCT_CAROUSEL',
  PRODUCT_COLLECTION: 'PRODUCT_COLLECTION',
  PRODUCT_GRID: 'PRODUCT_GRID',
  BRAND_STRIP: 'BRAND_STRIP',
  BRAND_LOGO_STRIP: 'BRAND_LOGO_STRIP',
  PROMO_BANNER: 'PROMO_BANNER',
  PROMO_BANNER_ROW_3: 'PROMO_BANNER_ROW_3',
  SALE_STRIP_BANNER: 'SALE_STRIP_BANNER',
  INFO_BLOCKS_3: 'INFO_BLOCKS_3',
  BLOG_LATEST_GRID: 'BLOG_LATEST_GRID',
  FOOTER_CONFIG: 'FOOTER_CONFIG',
  NEWSLETTER_BLOCK: 'NEWSLETTER_BLOCK',
  TESTIMONIALS: 'TESTIMONIALS',
  // Standard types
  RICH_TEXT: 'RICH_TEXT',
  IMAGE: 'IMAGE',
  BANNER_CAROUSEL: 'BANNER_CAROUSEL',
  // Legacy
  HERO_BANNER: 'HERO_BANNER',
  FEATURED_PRODUCTS: 'FEATURED_PRODUCTS',
  BRAND_SHOWCASE: 'BRAND_SHOWCASE',
  PROMO_STRIP: 'PROMO_STRIP',
  NEW_ARRIVALS: 'NEW_ARRIVALS',
  BEST_SELLERS: 'BEST_SELLERS',
  TEXT_BLOCK: 'TEXT_BLOCK',
  IMAGE_GALLERY: 'IMAGE_GALLERY',
  CUSTOM_HTML: 'CUSTOM_HTML',
} as const;

export type LandingSectionTypeValue = (typeof LandingSectionType)[keyof typeof LandingSectionType];

// -- Banner DTO ---------------------------------------------------------------

export interface BannerDto {
  id: string;
  placement: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  imageDesktopUrl: string;
  startAt?: string;
  endAt?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// -- Landing page / section ---------------------------------------------------

export interface LandingPageDto {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  heroBannerId?: string;
  heroBanner?: BannerDto;
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  sections: LandingSectionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface LandingSectionDto {
  id: string;
  landingPageId: string;
  type: string;
  title?: string;
  subtitle?: string;
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
