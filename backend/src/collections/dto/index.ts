import { IsString, IsOptional, IsBoolean, IsInt, IsObject, Min, IsEnum } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export enum ProductCollectionStrategy {
  NEWEST = 'NEWEST',
  BEST_SELLING = 'BEST_SELLING',
  FEATURED = 'FEATURED',
  MANUAL = 'MANUAL',
  CATEGORY_FILTER = 'CATEGORY_FILTER',
  BRAND_FILTER = 'BRAND_FILTER',
  TAG_FILTER = 'TAG_FILTER',
  PRICE_RANGE = 'PRICE_RANGE',
  ON_SALE = 'ON_SALE',
}

export class CreateCollectionDto {
  @IsString()
  key: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsEnum(ProductCollectionStrategy)
  strategy?: ProductCollectionStrategy;

  @IsOptional()
  @IsObject()
  ruleJson?: Record<string, any>;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}

export class AddCollectionItemDto {
  @IsInt()
  productId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ReorderCollectionItemsDto {
  orders: Array<{ productId: number; sortOrder: number }>;
}
