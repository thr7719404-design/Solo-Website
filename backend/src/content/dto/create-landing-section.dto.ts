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
  CATEGORY_TILES = 'CATEGORY_TILES',
  PRODUCT_CAROUSEL = 'PRODUCT_CAROUSEL',
  BRAND_STRIP = 'BRAND_STRIP',
  PROMO_BANNER = 'PROMO_BANNER',
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
