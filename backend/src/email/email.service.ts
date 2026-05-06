import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { CircuitBreakerService } from '../common/resilience/circuit-breaker.service';

export type EmailMode = 'mailpit' | 'console' | 'smtp';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly emailMode: EmailMode;
  private smtpAvailable = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly breaker: CircuitBreakerService,
  ) {
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
      const isProduction = this.emailMode === 'smtp';
      const transportOptions: nodemailer.TransportOptions = {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure === true || String(smtpSecure) === 'true', // true for port 465, false for STARTTLS on 587
        ...(isProduction ? {} : { tls: { rejectUnauthorized: false } }),
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
    // Console mode or unavailable SMTP means the message was not actually delivered.
    if (this.emailMode === 'console') {
      this.logEmailToConsole(options);
      return false;
    }

    if (!this.smtpAvailable) {
      this.logEmailToConsole(options);
      return false;
    }

    try {
      const info = await this.breaker.execute(
        'smtp',
        () =>
          this.transporter!.sendMail({
            from: this.getFromAddress(),
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
            attachments: options.attachments?.map(a => ({
              filename: a.filename,
              content: a.content,
              contentType: a.contentType,
            })),
          }),
        { timeout: 15_000 },
      );

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
    const year = new Date().getFullYear();

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Solo</title>
        <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
      </head>
      <body style="margin:0;padding:0;background-color:#f6f6f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f2;">
          <tr><td style="padding:40px 20px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" align="center" style="max-width:600px;width:100%;margin:0 auto;">

              <!-- Logo Bar -->
              <tr>
                <td style="text-align:center;padding:32px 0 24px;">
                  <span style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;letter-spacing:6px;color:#1a1a1a;">SOLO</span>
                </td>
              </tr>

              <!-- Hero Image Area -->
              <tr>
                <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);border-radius:16px 16px 0 0;padding:48px 40px 40px;text-align:center;">
                  <div style="width:72px;height:72px;margin:0 auto 24px;border-radius:50%;background:linear-gradient(135deg,#B8860B,#D4A843);display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:32px;line-height:72px;">&#9993;</span>
                  </div>
                  <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Welcome, ${displayName}</h1>
                  <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.5;">You're one step away from unlocking your Solo experience.</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="background:#ffffff;padding:40px;">
                  <p style="margin:0 0 24px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                    Thank you for creating your Solo account. We curate premium kitchenware and home essentials for the modern lifestyle. To get started, please verify your email address.
                  </p>

                  <!-- CTA Button -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="text-align:center;padding:8px 0 32px;">
                      <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#B8860B,#D4A843);color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;padding:16px 48px;border-radius:8px;box-shadow:0 4px 16px rgba(184,134,11,0.3);">Verify My Email</a>
                    </td></tr>
                  </table>

                  <p style="margin:0 0 8px;font-size:12px;color:#999;text-align:center;">Or copy this link into your browser:</p>
                  <div style="background:#f8f7f4;border:1px solid #e8e6e0;border-radius:8px;padding:14px 16px;margin:0 0 32px;">
                    <a href="${verifyUrl}" style="font-family:'Courier New',monospace;font-size:11px;color:#B8860B;word-break:break-all;text-decoration:none;">${verifyUrl}</a>
                  </div>

                  <!-- Divider -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="padding:0 0 28px;">
                      <div style="height:1px;background:linear-gradient(90deg,transparent,#e0ddd6,transparent);"></div>
                    </td></tr>
                  </table>

                  <!-- Benefits Grid -->
                  <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#1a1a1a;text-align:center;">Your Solo Membership Includes</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
                        <div style="background:#faf9f6;border-radius:10px;padding:20px 16px;text-align:center;border:1px solid #f0ede6;">
                          <div style="font-size:24px;margin-bottom:8px;">&#10024;</div>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a1a;">Curated Collections</p>
                          <p style="margin:4px 0 0;font-size:11px;color:#888;">Premium brands, handpicked</p>
                        </div>
                      </td>
                      <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
                        <div style="background:#faf9f6;border-radius:10px;padding:20px 16px;text-align:center;border:1px solid #f0ede6;">
                          <div style="font-size:24px;margin-bottom:8px;">&#127873;</div>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a1a;">Loyalty Rewards</p>
                          <p style="margin:4px 0 0;font-size:11px;color:#888;">Earn points on every order</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                        <div style="background:#faf9f6;border-radius:10px;padding:20px 16px;text-align:center;border:1px solid #f0ede6;">
                          <div style="font-size:24px;margin-bottom:8px;">&#128666;</div>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a1a;">Free Shipping</p>
                          <p style="margin:4px 0 0;font-size:11px;color:#888;">On orders over AED 75</p>
                        </div>
                      </td>
                      <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                        <div style="background:#faf9f6;border-radius:10px;padding:20px 16px;text-align:center;border:1px solid #f0ede6;">
                          <div style="font-size:24px;margin-bottom:8px;">&#128260;</div>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a1a;">Easy Returns</p>
                          <p style="margin:4px 0 0;font-size:11px;color:#888;">Hassle-free return policy</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Expiry Notice -->
              <tr>
                <td style="background:#faf9f6;padding:16px 40px;text-align:center;border-top:1px solid #f0ede6;">
                  <p style="margin:0;font-size:12px;color:#999;">This verification link expires in <strong style="color:#B8860B;">1 hour</strong>. If you didn't create this account, you can safely ignore this email.</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#1a1a1a;border-radius:0 0 16px 16px;padding:32px 40px;text-align:center;">
                  <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;letter-spacing:4px;color:#ffffff;">SOLO</span>
                  <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;">
                    Premium Kitchenware &amp; Home Essentials<br>
                    VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ,<br>
                    Ras Al Khaimah, United Arab Emirates &middot; Tel: 0557133051<br>
                    &copy; ${year} Solo. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    const text = `
SOLO — Welcome, ${displayName}!

Thank you for creating your Solo account. We curate premium kitchenware and home essentials for the modern lifestyle.

Please verify your email address by visiting:
${verifyUrl}

This link will expire in 1 hour.

Your Solo membership includes:
- Curated premium collections
- Loyalty rewards on every order
- Free shipping on orders over AED 75
- Hassle-free returns

If you didn't create this account, please ignore this email.

—
Solo Trading
VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ
Ras Al Khaimah, United Arab Emirates
Tel: 0557133051

© ${year} Solo. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Solo — Verify Your Email',
      text,
      html,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5000');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const year = new Date().getFullYear();

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
      </head>
      <body style="margin:0;padding:0;background-color:#f6f6f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f2;">
          <tr><td style="padding:40px 20px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" align="center" style="max-width:600px;width:100%;margin:0 auto;">

              <!-- Logo Bar -->
              <tr>
                <td style="text-align:center;padding:32px 0 24px;">
                  <span style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;letter-spacing:6px;color:#1a1a1a;">SOLO</span>
                </td>
              </tr>

              <!-- Hero -->
              <tr>
                <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);border-radius:16px 16px 0 0;padding:48px 40px 40px;text-align:center;">
                  <div style="width:72px;height:72px;margin:0 auto 24px;border-radius:50%;background:linear-gradient(135deg,#B8860B,#D4A843);display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:32px;line-height:72px;">&#128274;</span>
                  </div>
                  <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Password Reset</h1>
                  <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.5;">We received a request to reset your password.</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="background:#ffffff;padding:40px;">
                  <p style="margin:0 0 24px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                    No worries — it happens to the best of us. Click the button below to create a new password for your Solo account.
                  </p>

                  <!-- CTA Button -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="text-align:center;padding:8px 0 32px;">
                      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#B8860B,#D4A843);color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;padding:16px 48px;border-radius:8px;box-shadow:0 4px 16px rgba(184,134,11,0.3);">Reset Password</a>
                    </td></tr>
                  </table>

                  <p style="margin:0 0 8px;font-size:12px;color:#999;text-align:center;">Or copy this link into your browser:</p>
                  <div style="background:#f8f7f4;border:1px solid #e8e6e0;border-radius:8px;padding:14px 16px;margin:0 0 32px;">
                    <a href="${resetUrl}" style="font-family:'Courier New',monospace;font-size:11px;color:#B8860B;word-break:break-all;text-decoration:none;">${resetUrl}</a>
                  </div>

                  <!-- Divider -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="padding:0 0 24px;">
                      <div style="height:1px;background:linear-gradient(90deg,transparent,#e0ddd6,transparent);"></div>
                    </td></tr>
                  </table>

                  <!-- Security Notice -->
                  <div style="background:#faf9f6;border-radius:10px;padding:20px 24px;border:1px solid #f0ede6;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1a1a1a;">&#128737; Security Tips</p>
                    <ul style="margin:0;padding:0 0 0 16px;font-size:13px;color:#666;line-height:1.8;">
                      <li>Choose a strong, unique password</li>
                      <li>Never share your password with anyone</li>
                      <li>If you didn't request this, ignore this email</li>
                    </ul>
                  </div>
                </td>
              </tr>

              <!-- Expiry Notice -->
              <tr>
                <td style="background:#faf9f6;padding:16px 40px;text-align:center;border-top:1px solid #f0ede6;">
                  <p style="margin:0;font-size:12px;color:#999;">This reset link expires in <strong style="color:#B8860B;">1 hour</strong>. Your current password remains unchanged until you set a new one.</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#1a1a1a;border-radius:0 0 16px 16px;padding:32px 40px;text-align:center;">
                  <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;letter-spacing:4px;color:#ffffff;">SOLO</span>
                  <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;">
                    Premium Kitchenware &amp; Home Essentials<br>
                    VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ,<br>
                    Ras Al Khaimah, United Arab Emirates &middot; Tel: 0557133051<br>
                    &copy; ${year} Solo. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    const text = `
SOLO — Password Reset

We received a request to reset your password for your Solo account.

Click here to reset your password:
${resetUrl}

This link will expire in 1 hour.

Security Tips:
- Choose a strong, unique password
- Never share your password with anyone
- If you didn't request this, ignore this email

Your current password remains unchanged until you set a new one.

—
Solo Trading
VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ
Ras Al Khaimah, United Arab Emirates
Tel: 0557133051

© ${year} Solo. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password — Solo',
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

  /**
   * Send order invoice email with PDF attachment.
   */
  async sendOrderInvoiceEmail(params: {
    to: string;
    customerName: string;
    orderNumber: string;
    invoiceNumber: string;
    total: number;
    currency?: string;
    pdfBuffer: Buffer;
  }): Promise<boolean> {
    const currency = params.currency || 'AED';
    const total = `${currency} ${Number(params.total || 0).toFixed(2)}`;
    const year = new Date().getFullYear();
    const subject = `Your Invoice ${params.invoiceNumber} — Order ${params.orderNumber}`;

    const html = `
      <!DOCTYPE html>
      <html><body style="margin:0;padding:0;background:#faf9f6;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;padding:32px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.05);">
              <tr><td style="background:#1a1a1a;padding:24px 32px;">
                <h1 style="margin:0;color:#B8860B;font-size:22px;letter-spacing:2px;">SOLO</h1>
              </td></tr>
              <tr><td style="padding:32px;">
                <h2 style="margin:0 0 12px;font-size:20px;">Thank you for your order, ${params.customerName}!</h2>
                <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
                  Your order <strong>#${params.orderNumber}</strong> has been received. Please find your invoice attached as a PDF for your records.
                </p>
                <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin:0 0 20px;">
                  <tr><td style="color:#888;">Invoice Number</td><td><strong>${params.invoiceNumber}</strong></td></tr>
                  <tr><td style="color:#888;">Order Number</td><td><strong>${params.orderNumber}</strong></td></tr>
                  <tr><td style="color:#888;">Total</td><td><strong>${total}</strong></td></tr>
                </table>
                <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
                  If you have any questions, simply reply to this email or contact our support team.
                </p>
              </td></tr>
              <tr><td style="background:#faf9f6;padding:16px 32px;text-align:center;border-top:1px solid #f0ede6;">
                <p style="margin:0 0 4px;font-size:11px;color:#666;line-height:1.5;">
                  VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ<br>
                  Ras Al Khaimah, United Arab Emirates &middot; Tel: 0557133051
                </p>
                <p style="margin:0;font-size:11px;color:#999;">© ${year} Solo. All rights reserved.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body></html>`;

    const text = `Thank you for your order, ${params.customerName}!

Your order #${params.orderNumber} has been received. Your invoice (${params.invoiceNumber}) is attached as a PDF.

Total: ${total}

If you have any questions, reply to this email or contact our support team.

—
Solo Trading
VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ
Ras Al Khaimah, United Arab Emirates
Tel: 0557133051

© ${year} Solo`;

    return this.sendEmail({
      to: params.to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: `${params.invoiceNumber}.pdf`,
          content: params.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }
}
