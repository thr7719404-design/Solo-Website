import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export enum UpdateReturnStatusDto {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ITEMS_RECEIVED = 'ITEMS_RECEIVED',
  REFUND_PROCESSING = 'REFUND_PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum RefundMethodDto {
  ORIGINAL_PAYMENT = 'ORIGINAL_PAYMENT',
  LOYALTY_CASH = 'LOYALTY_CASH',
  STORE_CREDIT = 'STORE_CREDIT',
}

export class AdminUpdateReturnDto {
  @IsEnum(UpdateReturnStatusDto)
  status: UpdateReturnStatusDto;

  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsEnum(RefundMethodDto)
  refundMethod?: RefundMethodDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}
