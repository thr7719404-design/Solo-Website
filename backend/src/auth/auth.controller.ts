import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register new user
   * Rate limited: 3 requests per hour per IP
   */
  @Post('register')
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Login with email and password
   * Rate limited: 5 requests per 15 minutes per IP
   */
  @Post('login')
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const forwarded = req.headers?.['x-forwarded-for'];
    const ipAddress = forwarded
      ? String(forwarded).split(',')[0].trim()
      : req.socket?.remoteAddress ?? req.ip;
    return this.authService.login(loginDto, {
      ipAddress,
      userAgent: req.headers?.['user-agent'],
    });
  }

  /**
   * Refresh access token using refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  /**
   * Logout (revoke refresh token)
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  /**
   * Change password
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.changePassword(userId, currentPassword, newPassword);
  }

  /**
   * Request password reset
   * Generates a reset token and (in production) sends an email
   */
  @Post('forgot-password')
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  /**
   * Reset password using token
   */
  @Post('reset-password')
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }

  /**
   * Verify email address using token
   */
  @Post('verify-email')
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  /**
   * Resend verification email
   */
  @Post('resend-verification')
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }
}
