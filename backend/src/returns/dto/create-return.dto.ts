import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReturnReasonDto {
  DEFECTIVE = 'DEFECTIVE',
  WRONG_ITEM = 'WRONG_ITEM',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  CHANGED_MIND = 'CHANGED_MIND',
  ARRIVED_LATE = 'ARRIVED_LATE',
  DAMAGED_IN_SHIPPING = 'DAMAGED_IN_SHIPPING',
  OTHER = 'OTHER',
}

export class ReturnItemDto {
  @IsString()
  @IsNotEmpty()
  orderItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateReturnDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsEnum(ReturnReasonDto)
  reason: ReturnReasonDto;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}
