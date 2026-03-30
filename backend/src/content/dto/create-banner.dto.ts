import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsDateString } from 'class-validator';

export enum BannerPlacement {
  HOME_HERO = 'HOME_HERO',
  HOME_TOP = 'HOME_TOP',
  HOME_MID = 'HOME_MID',
  HOME_BOTTOM = 'HOME_BOTTOM',
  CATEGORY_TOP = 'CATEGORY_TOP',
  CART_TOP = 'CART_TOP',
}

export class CreateBannerDto {
  @IsEnum(BannerPlacement)
  @IsOptional()
  placement?: BannerPlacement;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  ctaText?: string;

  @IsString()
  @IsOptional()
  ctaUrl?: string;

  @IsString()
  imageDesktopUrl: string;

  @IsString()
  @IsOptional()
  imageMobileUrl?: string;

  @IsDateString()
  @IsOptional()
  startAt?: string;

  @IsDateString()
  @IsOptional()
  endAt?: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
