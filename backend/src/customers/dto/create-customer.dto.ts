import { IsString, IsEmail, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCustomerResponseDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  generatedPassword?: string; // Only returned if password was auto-generated
}
