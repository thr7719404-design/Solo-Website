import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// Navigation Menu DTOs
export class CreateNavigationMenuDto {
  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateNavigationMenuDto extends PartialType(CreateNavigationMenuDto) {}

// Navigation Menu Item DTOs
export class CreateNavigationMenuItemDto {
  @IsString()
  menuId: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  badgeColor?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateNavigationMenuItemDto extends PartialType(CreateNavigationMenuItemDto) {}

export class ReorderMenuItemsDto {
  orders: Array<{ id: string; sortOrder: number }>;
}
