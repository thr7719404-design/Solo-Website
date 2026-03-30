import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  /**
   * Register new user with secure password hashing (OWASP ASVS V2.1)
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with Argon2id (OWASP recommended)
    // Parameters aligned with OWASP recommendations
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3, // 3 iterations
      parallelism: 4, // 4 parallel threads
    });

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone,
        role: 'CUSTOMER',
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Create cart for user
    await this.prisma.cart.create({
      data: {
        userId: user.id,
      },
    });

    // Generate email verification token and send welcome email
    const verificationToken = await this.createEmailVerificationToken(user.id);
    await this.emailService.sendWelcomeAndVerificationEmail(
      user.email,
      user.firstName,
      verificationToken
    );

    // Only include verification token in response for development
    const isDev = this.configService.get<string>('APP_ENV', 'development') === 'development';

    return {
      user,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      message: 'Registration successful! Please check your email to verify your account.',
      ...(isDev && { verificationToken }),
    };
  }

  /**
   * Create email verification token
   */
  private async createEmailVerificationToken(userId: string): Promise<string> {
    // Invalidate any existing verification tokens for this user
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    // Store SHA256 hash of token (never store raw token)
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    return rawToken;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verificationToken.usedAt) {
      throw new BadRequestException('Verification token has already been used');
    }

    if (new Date() > verificationToken.expiresAt) {
      throw new BadRequestException('Verification token has expired');
    }

    if (verificationToken.user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Mark user as verified and token as used (transaction)
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log(`Email verified for user: ${verificationToken.user.email}`);

    return { 
      message: 'Email verified successfully!',
      email: verificationToken.user.email,
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a verification link has been sent.' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token and send email
    const verificationToken = await this.createEmailVerificationToken(user.id);
    await this.emailService.sendWelcomeAndVerificationEmail(
      user.email,
      user.firstName,
      verificationToken
    );

    // Only include token in response for development
    const isDev = this.configService.get<string>('APP_ENV', 'development') === 'development';

    return { 
      message: 'If an account with that email exists, a verification link has been sent.',
      ...(isDev && { verificationToken }),
    };
  }

  /**
   * Login user with credentials (OWASP ASVS V2.2)
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!isPasswordValid) {
      // Log failed attempt (for monitoring/security)
      // TODO: Implement account lockout after X failed attempts
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  /**
   * Refresh access token using refresh token (OWASP ASVS V3.2)
   */
  async refreshTokens(refreshToken: string) {
    // Find refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Verify token
    try {
      await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old refresh token (refresh token rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    return tokens;
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Validate user (used by LocalStrategy)
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    // Generate access token (short-lived: 15 minutes)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
    });

    // Generate refresh token (long-lived: 7 days)
    // Add timestamp to payload to ensure uniqueness
    const refreshPayload = { ...payload, iat: Math.floor(Date.now() / 1000), jti: `${userId}-${Date.now()}` };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Delete any existing refresh tokens for this user to avoid constraint issues
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isPasswordValid = await argon2.verify(user.passwordHash, currentPassword);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all refresh tokens (force re-login)
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Request password reset - generates a reset token and sends email
   */
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    // Invalidate any existing reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Send password reset email
    const emailSent = await this.emailService.sendPasswordResetEmail(user.email, token);
    
    if (emailSent) {
      this.logger.log(`Password reset email sent to: ${user.email}`);
    } else {
      this.logger.warn(`Failed to send password reset email to: ${user.email}`);
    }
    
    // In development, also return the token for testing
    const isDev = this.configService.get<string>('APP_ENV', 'development') === 'development';
    
    return { 
      message: 'If an account with that email exists, a reset link has been sent.',
      // Only include token in development mode for testing
      ...(isDev && { resetToken: token }),
    };
  }

  /**
   * Reset password using a valid reset token
   */
  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Reset token has already been used');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Update password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens (force re-login)
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId },
        data: { isRevoked: true },
      }),
    ]);

    return { message: 'Password has been reset successfully' };
  }
}
