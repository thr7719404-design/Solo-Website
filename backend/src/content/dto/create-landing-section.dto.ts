import { IsString, IsEnum, IsUUID, IsInt, IsBoolean, IsOptional } from 'class-validator';

export enum LandingSectionType {
  // Original types
  PRODUCT_GRID = 'PRODUCT_GRID',
  CATEGORY_GRID = 'CATEGORY_GRID',
  RICH_TEXT = 'RICH_TEXT',
  IMAGE = 'IMAGE',
  BANNER_CAROUSEL = 'BANNER_CAROUSEL',
  // Porto-style homepage section types
  HERO = 'HERO',
  HERO_SLIDER = 'HERO_SLIDER',
  HERO_BANNER = 'HERO_BANNER',
  CATEGORY_TILES = 'CATEGORY_TILES',
  PRODUCT_CAROUSEL = 'PRODUCT_CAROUSEL',
  PRODUCT_COLLECTION = 'PRODUCT_COLLECTION',
  BRAND_STRIP = 'BRAND_STRIP',
  BRAND_LOGO_STRIP = 'BRAND_LOGO_STRIP',
  BRAND_SHOWCASE = 'BRAND_SHOWCASE',
  PROMO_BANNER = 'PROMO_BANNER',
  PROMO_BANNER_ROW_3 = 'PROMO_BANNER_ROW_3',
  PROMO_STRIP = 'PROMO_STRIP',
  SALE_STRIP_BANNER = 'SALE_STRIP_BANNER',
  TOP_PROMO_BAR = 'TOP_PROMO_BAR',
  TOP_LINKS_BAR = 'TOP_LINKS_BAR',
  MAIN_HEADER = 'MAIN_HEADER',
  PRIMARY_NAV = 'PRIMARY_NAV',
  VALUE_PROPS_ROW = 'VALUE_PROPS_ROW',
  INFO_BLOCKS_3 = 'INFO_BLOCKS_3',
  CATEGORY_CIRCLE_STRIP = 'CATEGORY_CIRCLE_STRIP',
  BLOG_LATEST_GRID = 'BLOG_LATEST_GRID',
  FOOTER_CONFIG = 'FOOTER_CONFIG',
  NEWSLETTER_BLOCK = 'NEWSLETTER_BLOCK',
  TESTIMONIALS = 'TESTIMONIALS',
  // Legacy aliases
  FEATURED_PRODUCTS = 'FEATURED_PRODUCTS',
  NEW_ARRIVALS = 'NEW_ARRIVALS',
  BEST_SELLERS = 'BEST_SELLERS',
}

export class CreateLandingSectionDto {
  @IsUUID()
  landingPageId: string;

  @IsEnum(LandingSectionType)
  type: LandingSectionType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  data: string; // JSON string

  @IsString()
  @IsOptional()
  config?: string; // JSON string for section settings

  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
