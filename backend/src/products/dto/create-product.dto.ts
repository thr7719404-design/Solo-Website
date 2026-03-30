import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray, Min, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Spec item for product specifications table
class SpecItemDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  // ==== NEW: Product Page Fields v1 ====
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  fullDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];  // e.g. ["Dishwasher Safe", "BPA Free"]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImageUrls?: string[];  // Array of image URLs

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecItemDto)
  specs?: SpecItemDto[];  // e.g. [{key: "Material", value: "Stainless Steel"}]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  returnsNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  urlSlug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;
  // ==== END: Product Page Fields v1 ====

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @IsString()
  @IsNotEmpty()
  brandId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  attributes?: string; // JSON string

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
