import { IsString, IsOptional, IsBoolean, IsInt, IsArray, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// Blog Post DTOs
export class CreateBlogPostDto {
  @IsString()
  categoryId: string;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  readTimeMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}

export class UpdateBlogPostDto extends PartialType(CreateBlogPostDto) {}

// Blog Category DTOs
export class CreateBlogCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBlogCategoryDto extends PartialType(CreateBlogCategoryDto) {}

// Blog Tag DTOs
export class CreateBlogTagDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBlogTagDto extends PartialType(CreateBlogTagDto) {}
