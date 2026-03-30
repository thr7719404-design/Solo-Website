import { IsOptional, IsString, IsNumber, IsEnum, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortBy {
  PRICE_LOW = 'price_asc',
  PRICE_HIGH = 'price_desc',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  NEWEST = 'newest',
  POPULARITY = 'popularity',
}

export class ProductFilterDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brandIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  q?: string; // Alias for search

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  isFeatured?: string;

  @IsOptional()
  @IsString()
  isNew?: string;

  @IsOptional()
  @IsString()
  isBestSeller?: string;

  @IsOptional()
  @IsString()
  inStock?: string;

  /**
   * Status filter for admin listing:
   * - 'all' = no filter (default)
   * - 'active' = isActive=true
   * - 'draft' = isActive=false
   * - 'out_of_stock' = stock <= 0
   */
  @IsOptional()
  @IsString()
  status?: string;

  /**
   * Direct isActive filter (alternative to status)
   */
  @IsOptional()
  @IsString()
  isActive?: string;

  @IsOptional()
  @IsString()
  isOnSale?: string;
}
