import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUrl, MinLength, MaxLength, ValidateIf } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  // Accept either `logo` or `logoUrl`. Skip URL validation for empty strings.
  @IsOptional()
  @ValidateIf((_o, value) => value !== '' && value !== null && value !== undefined)
  @IsString()
  @IsUrl({ require_tld: false })
  logo?: string;

  @IsOptional()
  @ValidateIf((_o, value) => value !== '' && value !== null && value !== undefined)
  @IsString()
  @IsUrl({ require_tld: false })
  logoUrl?: string;

  @IsOptional()
  @ValidateIf((_o, value) => value !== '' && value !== null && value !== undefined)
  @IsString()
  @IsUrl({ require_tld: false })
  website?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
