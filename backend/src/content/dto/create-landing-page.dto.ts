import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateLandingPageDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsUUID()
  @IsOptional()
  heroBannerId?: string;

  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  seoDescription?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
