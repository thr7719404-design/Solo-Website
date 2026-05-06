import { IsString, IsNotEmpty, IsEmail, IsArray, ValidateNested, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkOrderItemDto {
  @IsInt()
  productId: number;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateBulkOrderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  countryCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkOrderItemDto)
  items: BulkOrderItemDto[];
}

export class UpdateBulkOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  status: 'NEW' | 'IN_PROGRESS' | 'CLOSED';

  @IsString()
  @IsOptional()
  adminNotes?: string;
}
