import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  lastName?: string;

  @IsString()
  @MaxLength(30, { message: 'Phone number must not exceed 30 characters' })
  // Allow digits, spaces, dashes, parentheses, and optional leading +
  @Matches(/^[+]?[\d\s\-\(\)]{7,30}$/, { message: 'Please provide a valid phone number' })
  @IsOptional()
  phone?: string;
}
