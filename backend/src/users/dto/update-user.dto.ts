import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateUserDto {
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
