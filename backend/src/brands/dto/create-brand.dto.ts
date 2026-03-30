import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUrl, MinLength, MaxLength } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  website?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
