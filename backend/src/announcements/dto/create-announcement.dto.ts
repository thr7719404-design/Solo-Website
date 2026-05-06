import { IsString, IsOptional, IsBoolean, IsInt, IsDateString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  text: string;

  @IsOptional() @IsString()
  linkUrl?: string;

  @IsOptional() @IsString()
  linkLabel?: string;

  @IsOptional() @IsString()
  bgColor?: string;

  @IsOptional() @IsString()
  textColor?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsInt()
  sortOrder?: number;

  @IsOptional() @IsString()
  promoCodeId?: string | null;

  @IsOptional() @IsDateString()
  startsAt?: string;

  @IsOptional() @IsDateString()
  expiresAt?: string;
}
