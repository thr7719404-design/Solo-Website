import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Match the Prisma enum
export enum CategoryLandingSectionType {
  SUBCATEGORY_NAV = 'SUBCATEGORY_NAV',
  PRODUCT_GRID = 'PRODUCT_GRID',
  FEATURED_COLLECTIONS = 'FEATURED_COLLECTIONS',
  NEW_ARRIVALS = 'NEW_ARRIVALS',
  TOP_SELLERS = 'TOP_SELLERS',
  BRAND_STRIP = 'BRAND_STRIP',
  PROMO_BANNER = 'PROMO_BANNER',
  SEO_FAQ = 'SEO_FAQ',
  LOYALTY_BANNER = 'LOYALTY_BANNER',
}

// ============================================================================
// CategoryLandingPageConfig DTOs
// ============================================================================

export class CreateCategoryLandingConfigDto {
  @IsString()
  categoryId: string;

  @IsString()
  @IsOptional()
  heroTitle?: string;

  @IsString()
  @IsOptional()
  heroSubtitle?: string;

  @IsString()
  @IsOptional()
  heroImageUrl?: string;

  @IsString()
  @IsOptional()
  heroImageMobileUrl?: string;

  @IsString()
  @IsOptional()
  ctaLabel?: string;

  @IsString()
  @IsOptional()
  ctaTargetType?: string;

  @IsString()
  @IsOptional()
  ctaTargetValue?: string;

  @IsBoolean()
  @IsOptional()
  isHeroEnabled?: boolean;
}

export class UpdateCategoryLandingConfigDto {
  @IsString()
  @IsOptional()
  heroTitle?: string;

  @IsString()
  @IsOptional()
  heroSubtitle?: string;

  @IsString()
  @IsOptional()
  heroImageUrl?: string;

  @IsString()
  @IsOptional()
  heroImageMobileUrl?: string;

  @IsString()
  @IsOptional()
  ctaLabel?: string;

  @IsString()
  @IsOptional()
  ctaTargetType?: string;

  @IsString()
  @IsOptional()
  ctaTargetValue?: string;

  @IsBoolean()
  @IsOptional()
  isHeroEnabled?: boolean;
}

// ============================================================================
// CategoryLandingSection DTOs
// ============================================================================

export class CreateCategoryLandingSectionDto {
  @IsString()
  landingId: string;

  @IsEnum(CategoryLandingSectionType)
  type: CategoryLandingSectionType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  position: number;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

export class UpdateCategoryLandingSectionDto {
  @IsEnum(CategoryLandingSectionType)
  @IsOptional()
  type?: CategoryLandingSectionType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  position?: number;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

// ============================================================================
// Response DTOs
// ============================================================================

export class CategoryLandingSectionResponseDto {
  id: string;
  landingId: string;
  type: CategoryLandingSectionType;
  title: string | null;
  position: number;
  isEnabled: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class CategoryLandingConfigResponseDto {
  id: string;
  categoryId: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
  heroImageMobileUrl: string | null;
  ctaLabel: string | null;
  ctaTargetType: string | null;
  ctaTargetValue: string | null;
  isHeroEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  sections: CategoryLandingSectionResponseDto[];
}

export class ReorderCategorySectionsDto {
  orders: Array<{ id: string; position: number }>;
}
