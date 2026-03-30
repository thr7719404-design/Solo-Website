import { IsNumber, IsOptional, IsBoolean, Min, Max, IsString } from 'class-validator';

export class SaveVatConfigDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  vatPercent: number;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsString()
  @IsOptional()
  label?: string;
}

export class SaveLoyaltyConfigDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  earnPercent: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  maxRedeemPercent?: number;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
