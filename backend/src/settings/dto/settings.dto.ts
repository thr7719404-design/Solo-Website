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

export class SaveShippingConfigDto {
  @IsNumber()
  @Min(0)
  @Max(10000)
  fee: number;

  @IsString()
  @IsOptional()
  label?: string;

  /** Free shipping kicks in when order subtotal >= this AED amount. 0 disables. */
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  @IsOptional()
  freeShippingThreshold?: number;
}

export class SavePaymentsConfigDto {
  // Cash on Delivery
  @IsBoolean() @IsOptional() codEnabled?: boolean;

  // Stripe (Credit/Debit Card)
  @IsBoolean() @IsOptional() stripeEnabled?: boolean;
  /** Empty string means "leave existing key untouched". */
  @IsString() @IsOptional() stripePublishableKey?: string;
  @IsString() @IsOptional() stripeSecretKey?: string;
  @IsString() @IsOptional() stripeWebhookSecret?: string;

  // Tabby
  @IsBoolean() @IsOptional() tabbyEnabled?: boolean;
  /** Empty string means "leave existing key untouched". */
  @IsString() @IsOptional() tabbyPublicKey?: string;
  @IsString() @IsOptional() tabbySecretKey?: string;

  // Tamara
  @IsBoolean() @IsOptional() tamaraEnabled?: boolean;
  @IsBoolean() @IsOptional() tamaraSandbox?: boolean;
  @IsString() @IsOptional() tamaraApiToken?: string;
}
