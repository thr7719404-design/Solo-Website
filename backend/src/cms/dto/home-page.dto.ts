import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Match the Prisma enum
export enum HomeSectionType {
  HERO_SLIDER = 'HERO_SLIDER',
  CATEGORY_TILES = 'CATEGORY_TILES',
  NEW_ARRIVALS = 'NEW_ARRIVALS',
  TOP_SELLERS = 'TOP_SELLERS',
  BRAND_STRIP = 'BRAND_STRIP',
  LOYALTY_BANNER = 'LOYALTY_BANNER',
  PROMO_BANNER = 'PROMO_BANNER',
}

// ============================================================================
// HomePageConfig DTOs
// ============================================================================

export class CreateHomePageConfigDto {
  @IsString()
  @IsOptional()
  key?: string; // defaults to "home"
}

export class UpdateHomePageConfigDto {
  @IsString()
  @IsOptional()
  key?: string;
}

// ============================================================================
// HomePageSection DTOs
// ============================================================================

export class CreateHomePageSectionDto {
  @IsString()
  homePageId: string;

  @IsEnum(HomeSectionType)
  type: HomeSectionType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

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

export class UpdateHomePageSectionDto {
  @IsEnum(HomeSectionType)
  @IsOptional()
  type?: HomeSectionType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

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

export class HomePageSectionResponseDto {
  id: string;
  homePageId: string;
  type: HomeSectionType;
  title: string | null;
  subtitle: string | null;
  position: number;
  isEnabled: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class HomePageConfigResponseDto {
  id: string;
  key: string;
  createdAt: Date;
  updatedAt: Date;
  sections: HomePageSectionResponseDto[];
}

export class ReorderSectionsDto {
  orders: Array<{ id: string; position: number }>;
}
