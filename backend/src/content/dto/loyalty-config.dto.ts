import { IsString, IsInt, IsArray, IsOptional, ValidateNested, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class HowItWorksItemDto {
  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class FaqItemDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class UpdateLoyaltyConfigDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  subtitle: string;

  @IsString()
  @IsNotEmpty()
  ctaText: string;

  @IsString()
  @IsNotEmpty()
  ctaUrl: string;

  @IsInt()
  @Min(1)
  spendAedThreshold: number;

  @IsInt()
  @Min(1)
  rewardAed: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HowItWorksItemDto)
  howItWorks: HowItWorksItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faqs: FaqItemDto[];
}

export class LoyaltyConfigResponseDto {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  spendAedThreshold: number;
  rewardAed: number;
  howItWorks: HowItWorksItemDto[];
  faqs: FaqItemDto[];
}
