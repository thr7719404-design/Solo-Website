import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export enum UpdateReturnStatusDto {
  APPROVED = 'APPROVED',
  PICKED_UP = 'PICKED_UP',
  QC = 'QC',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
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
