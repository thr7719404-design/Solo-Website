import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  label?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  addressLine1: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  postalCode?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;
}
