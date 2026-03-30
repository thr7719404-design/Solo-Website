import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Register new user
   * Rate limited: 3 requests per hour per IP
   */
  @Post('register')
  @Throttle({ strict: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Login with email and password
   * Rate limited: 5 requests per 15 minutes per IP
   */
  @Post('login')
  @Throttle({ strict: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Refresh access token using refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  /**
   * Logout (revoke refresh token)
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
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
  @Throttle({ strict: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  /**
   * Reset password using token
   */
  @Post('reset-password')
  @Throttle({ strict: { ttl: 900000, limit: 5 } })
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
  @Throttle({ strict: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  /**
   * Resend verification email
   */
  @Post('resend-verification')
  @Throttle({ strict: { ttl: 900000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }
}
