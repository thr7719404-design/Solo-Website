import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export type EmailMode = 'mailpit' | 'console' | 'smtp';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private emailMode: EmailMode;
  private smtpAvailable = false;

  constructor(private configService: ConfigService) {
    this.emailMode = this.configService.get<EmailMode>('EMAIL_MODE', 'mailpit');
  }

  async onModuleInit() {
    await this.initializeTransporter();
  }

  private async initializeTransporter() {
    // Use 127.0.0.1 instead of localhost to avoid IPv4/IPv6 resolution issues
    const smtpHost = this.configService.get<string>('SMTP_HOST', '127.0.0.1');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 1025);
    const smtpUser = this.configService.get<string>('SMTP_USER', '');
    const smtpPass = this.configService.get<string>('SMTP_PASS', '');
    const smtpSecure = this.configService.get<boolean>('SMTP_SECURE', false);

    if (this.emailMode === 'console') {
      this.logger.log('Email mode: CONSOLE - Emails will be logged to console only');
      this.smtpAvailable = false;
      return;
    }

    try {
      // For Mailpit (local dev), we need plain SMTP without any TLS
      const transportOptions: nodemailer.TransportOptions = {
        host: smtpHost,
        port: smtpPort,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
      } as any;

      // Only add auth if credentials are provided
      if (smtpUser && smtpPass) {
        (transportOptions as any).auth = {
          user: smtpUser,
          pass: smtpPass,
        };
      }

      this.transporter = nodemailer.createTransport(transportOptions);

      // Verify connection
      this.logger.log(`Attempting to connect to SMTP at ${smtpHost}:${smtpPort}...`);
      await this.transporter.verify();
      this.smtpAvailable = true;
      this.logger.log(`Email mode: ${this.emailMode.toUpperCase()} - SMTP connected to ${smtpHost}:${smtpPort}`);
    } catch (error) {
      this.smtpAvailable = false;
      this.transporter = null;
      
      if (this.emailMode === 'mailpit') {
        this.logger.warn(`Mailpit not available at ${smtpHost}:${smtpPort} - falling back to console mode`);
        this.logger.warn(`Connection error: ${error.message}`);
        this.logger.warn('To use Mailpit: download from https://github.com/axllent/mailpit/releases and run mailpit.exe');
      } else {
        this.logger.error(`SMTP connection failed: ${error.message}`);
      }
    }
  }

  private getFromAddress(): string {
    return this.configService.get<string>('SMTP_FROM', 'Solo <no-reply@solo.local>');
  }

  private logEmailToConsole(options: EmailOptions): void {
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log('📧 EMAIL (Console Mode)');
    this.logger.log('═══════════════════════════════════════════════════════════════');
    this.logger.log(`From: ${this.getFromAddress()}`);
    this.logger.log(`To: ${options.to}`);
    this.logger.log(`Subject: ${options.subject}`);
    this.logger.log('───────────────────────────────────────────────────────────────');
    if (options.text) {
      this.logger.log(options.text);
    }
    this.logger.log('═══════════════════════════════════════════════════════════════');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    // Console mode or fallback when SMTP unavailable
    if (this.emailMode === 'console' || !this.smtpAvailable) {
      this.logEmailToConsole(options);
      return true; // Return true since we "sent" it (logged it)
    }

    try {
      const info = await this.transporter!.sendMail({
        from: this.getFromAddress(),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`Email sent successfully to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      
      // Fallback to console logging
      this.logger.warn('Falling back to console logging for this email');
      this.logEmailToConsole(options);
      return false;
    }
  }

  async sendWelcomeAndVerificationEmail(
    email: string, 
    firstName: string | null, 
    verificationToken: string
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5000');
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    const displayName = firstName || 'there';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Solo</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #4F46E5; color: white !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #4338CA; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .link { background: #f3f4f6; padding: 12px; border-radius: 4px; font-family: monospace; word-break: break-all; font-size: 12px; margin: 15px 0; }
          .features { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .features ul { margin: 10px 0; padding-left: 20px; }
          .features li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ Welcome to Solo!</h1>
          </div>
          <div class="content">
            <h2>Hey ${displayName}! 👋</h2>
            <p>Thanks for joining Solo! We're excited to have you on board.</p>
            
            <p><strong>One quick step:</strong> Please verify your email address to get started:</p>
            
            <p style="text-align: center;">
              <a href="${verifyUrl}" class="button">✉️ Verify My Email</a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="link">${verifyUrl}</div>
            
            <p><em>This link will expire in 1 hour.</em></p>
            
            <div class="features">
              <strong>What you can do with your account:</strong>
              <ul>
                <li>🛒 Shop from our curated collection</li>
                <li>💰 Earn loyalty points on every purchase</li>
                <li>📦 Track your orders in real-time</li>
                <li>💳 Save payment methods for faster checkout</li>
              </ul>
            </div>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Solo. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to Solo! 🛍️

Hey ${displayName}!

Thanks for joining Solo! We're excited to have you on board.

Please verify your email address by clicking the link below:

${verifyUrl}

This link will expire in 1 hour.

What you can do with your account:
- Shop from our curated collection
- Earn loyalty points on every purchase
- Track your orders in real-time
- Save payment methods for faster checkout

If you didn't create an account with us, please ignore this email.

© ${new Date().getFullYear()} Solo
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Solo! Please verify your email ✉️',
      text,
      html,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5000');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #4F46E5; color: white !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .link { background: #f3f4f6; padding: 12px; border-radius: 4px; font-family: monospace; word-break: break-all; font-size: 12px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <div class="link">${resetUrl}</div>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Solo. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request

Hello,

We received a request to reset your password for your Solo account.

Click here to reset your password: ${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} Solo
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Solo',
      text,
      html,
    });
  }

  isSmtpAvailable(): boolean {
    return this.smtpAvailable;
  }

  getEmailMode(): EmailMode {
    return this.emailMode;
  }
}
