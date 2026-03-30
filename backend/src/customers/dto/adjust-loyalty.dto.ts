import { IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class AdjustLoyaltyDto {
  @IsNumber()
  @IsNotEmpty()
  amountAed: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class LoyaltySummaryDto {
  balanceAed: number;
  totalEarnedAed: number;
  totalRedeemedAed: number;
}
