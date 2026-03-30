import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(0.5)
  amount: number; // Amount in AED (or currency unit), NOT cents

  @IsOptional()
  @IsString()
  currency?: string; // Defaults to 'aed'

  @IsOptional()
  metadata?: Record<string, string>;
}

export class SaveStripeConfigDto {
  @IsString()
  secretKey: string;

  @IsString()
  publishableKey: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
