// ============================================================================
// Auth Types — matches NestJS backend /auth/* responses
// ============================================================================

export interface UserDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto {
  user: UserDto;
  tokens: TokensDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
