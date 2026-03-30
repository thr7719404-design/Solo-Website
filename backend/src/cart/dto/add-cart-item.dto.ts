import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum CartItemType {
  PRODUCT = 'PRODUCT',
  PACKAGE = 'PACKAGE',
}

export class AddCartItemDto {
  @IsEnum(CartItemType)
  type: CartItemType;

  @IsString()
  @IsNotEmpty()
  itemId: string; // productId or packageId

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  customization?: string; // JSON string for any customization options
}
