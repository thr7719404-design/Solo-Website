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
    return this.configService.get<string>('SMTP_FROM', 'Collation Foundation Curation <no-reply@solo.local>');
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
    const frontendUrl = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:5000') || '').split(',')[0].trim();
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    const displayName = firstName || 'there';
    const year = new Date().getFullYear();

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Collation Foundation Curation</title>
        <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
      </head>
      <body style="margin:0;padding:0;background-color:#f6f6f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f2;">
          <tr><td style="padding:40px 20px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" align="center" style="max-width:600px;width:100%;margin:0 auto;">

              <!-- Logo Bar -->
              <tr>
                <td style="text-align:center;padding:32px 0 24px;">
                  <span style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;letter-spacing:6px;color:#1a1a1a;">CFC</span>
                </td>
              </tr>

              <!-- Hero Image Area -->
              <tr>
                <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);border-radius:16px 16px 0 0;padding:48px 40px 40px;text-align:center;">
                  <div style="width:72px;height:72px;margin:0 auto 24px;border-radius:50%;background:linear-gradient(135deg,#B8860B,#D4A843);display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:32px;line-height:72px;">&#9993;</span>
                  </div>
                  <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Welcome, ${displayName}</h1>
                  <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.5;">You're one step away from unlocking your Collation Foundation Curation experience.</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="background:#ffffff;padding:40px;">
                  <p style="margin:0 0 24px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                    Thank you for creating your Collation Foundation Curation account. We curate premium kitchenware and home essentials for the modern lifestyle. To get started, please verify your email address.
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
                  <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#1a1a1a;text-align:center;">Your Collation Foundation Curation Membership Includes</p>
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
                  <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;letter-spacing:4px;color:#ffffff;">CFC</span>
                  <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;">
                    Premium Kitchenware &amp; Home Essentials<br>
                    VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ,<br>
                    Ras Al Khaimah, United Arab Emirates &middot; Tel: 0557133051<br>
                    &copy; ${year} Collation Foundation Curation. All rights reserved.
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
CFC \u2014 Welcome, ${displayName}!

Thank you for creating your Collation Foundation Curation account. We curate premium kitchenware and home essentials for the modern lifestyle.

Please verify your email address by visiting:
${verifyUrl}

This link will expire in 1 hour.

Your Collation Foundation Curation membership includes:
- Curated premium collections
- Loyalty rewards on every order
- Free shipping on orders over AED 75
- Hassle-free returns

If you didn't create this account, please ignore this email.

—
Collation Foundation Curation Trading
VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ
Ras Al Khaimah, United Arab Emirates
Tel: 0557133051

© ${year} Collation Foundation Curation. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Collation Foundation Curation — Verify Your Email',
      text,
      html,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const frontendUrl = (this.configService.get<string>('FRONTEND_URL', 'http://localhost:5000') || '').split(',')[0].trim();
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
                  <span style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;letter-spacing:6px;color:#1a1a1a;">CFC</span>
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
                    No worries — it happens to the best of us. Click the button below to create a new password for your Collation Foundation Curation account.
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
                  <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;letter-spacing:4px;color:#ffffff;">CFC</span>
                  <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;">
                    Premium Kitchenware &amp; Home Essentials<br>
                    VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ,<br>
                    Ras Al Khaimah, United Arab Emirates &middot; Tel: 0557133051<br>
                    &copy; ${year} Collation Foundation Curation. All rights reserved.
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
CFC \u2014 Password Reset

We received a request to reset your password for your Collation Foundation Curation account.

Click here to reset your password:
${resetUrl}

This link will expire in 1 hour.

Security Tips:
- Choose a strong, unique password
- Never share your password with anyone
- If you didn't request this, ignore this email

Your current password remains unchanged until you set a new one.

—
Collation Foundation Curation Trading
VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ
Ras Al Khaimah, United Arab Emirates
Tel: 0557133051

© ${year} Collation Foundation Curation. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password — Collation Foundation Curation',
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
                <h1 style="margin:0;color:#B8860B;font-size:22px;letter-spacing:2px;">CFC</h1>
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
                <p style="margin:0;font-size:11px;color:#999;">© ${year} Collation Foundation Curation. All rights reserved.</p>
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
Collation Foundation Curation Trading
VUET0399 Compass Building - Al Hulaila, Al Hulaila Industrial Zone-FZ
Ras Al Khaimah, United Arab Emirates
Tel: 0557133051

© ${year} Collation Foundation Curation`;

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

  /**
   * Send an order notification to the business owner whenever a new order is placed.
   * The email shows the latest placed order at the top, followed by all other
   * "incomplete" items the owner needs to action: open regular orders (not yet
   * delivered/cancelled/refunded), open returns, and open bulk-order requests.
   *
   * Recipient is read from OWNER_NOTIFICATION_EMAIL (default
   * collationformationcuration@gmail.com).
   */
  async sendOwnerOrderNotification(payload: {
    latestOrder: {
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string | null;
      shippingCity?: string | null;
      paymentMethod?: string | null;
      status: string;
      itemCount: number;
      total: number;
      currency?: string;
      createdAt: Date;
      items: Array<{ name: string; sku?: string | null; quantity: number; unitPrice: number }>;
    };
    incompleteOrders: Array<{
      orderNumber: string;
      customerName: string;
      customerPhone?: string | null;
      shippingCity?: string | null;
      paymentMethod?: string | null;
      status: string;
      total: number;
      createdAt: Date;
    }>;
    pendingReturns: Array<{
      returnNumber: string;
      orderNumber: string;
      customerName: string;
      status: string;
      refundAmount: number;
      createdAt: Date;
    }>;
    openBulkOrders: Array<{
      orderNumber: string | number;
      customerName: string;
      customerPhone?: string | null;
      customerEmail?: string | null;
      status: string;
      itemCount: number;
      createdAt: Date;
    }>;
  }): Promise<boolean> {
    const recipient = this.configService.get<string>(
      'OWNER_NOTIFICATION_EMAIL',
      'collationformationcuration@gmail.com',
    );
    const currency = payload.latestOrder.currency || 'AED';
    const fmtMoney = (n: number) => `${currency} ${Number(n || 0).toFixed(2)}`;
    const fmtMethod = (m?: string | null) => {
      if (!m) return '—';
      return m
        .toLowerCase()
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    };
    const fmtDate = (d: Date) =>
      new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    const escapeHtml = (s: any): string =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const lo = payload.latestOrder;

    const itemsRows = lo.items
      .map(
        it => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:13px;">${escapeHtml(it.name)}${it.sku ? ` <span style="color:#999;">(${escapeHtml(it.sku)})</span>` : ''}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:13px;text-align:center;">${it.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:13px;text-align:right;">${fmtMoney(Number(it.unitPrice))}</td>
        </tr>`,
      )
      .join('');

    const incompleteRows = payload.incompleteOrders.length
      ? payload.incompleteOrders
          .map(
            o => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;"><strong>#${escapeHtml(o.orderNumber)}</strong></td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;">${escapeHtml(o.customerName)}${o.customerPhone ? `<br><span style="color:#888;">${escapeHtml(o.customerPhone)}</span>` : ''}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;">${escapeHtml(o.shippingCity || '—')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;">${escapeHtml(fmtMethod(o.paymentMethod))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;">${escapeHtml(o.status)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;text-align:right;">${fmtMoney(Number(o.total))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;color:#888;">${fmtDate(o.createdAt)}</td>
        </tr>`,
          )
          .join('')
      : `<tr><td colspan="7" style="padding:12px;text-align:center;color:#999;font-size:12px;">No other incomplete orders.</td></tr>`;

    const returnRows = payload.pendingReturns.length
      ? payload.pendingReturns
          .map(
            r => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;"><strong>${escapeHtml(r.returnNumber)}</strong></td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;">#${escapeHtml(r.orderNumber)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;">${escapeHtml(r.customerName)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;">${escapeHtml(r.status)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;text-align:right;">${fmtMoney(Number(r.refundAmount))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;color:#888;">${fmtDate(r.createdAt)}</td>
        </tr>`,
          )
          .join('')
      : `<tr><td colspan="6" style="padding:12px;text-align:center;color:#999;font-size:12px;">No pending returns.</td></tr>`;

    const bulkRows = payload.openBulkOrders.length
      ? payload.openBulkOrders
          .map(
            b => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;"><strong>BO-${escapeHtml(String(b.orderNumber).padStart(5, '0'))}</strong></td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;">${escapeHtml(b.customerName)}${b.customerEmail ? `<br><span style="color:#888;">${escapeHtml(b.customerEmail)}</span>` : ''}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;">${escapeHtml(b.customerPhone || '—')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;text-align:center;">${b.itemCount}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;">${escapeHtml(b.status)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ede6;font-size:12px;color:#888;">${fmtDate(b.createdAt)}</td>
        </tr>`,
          )
          .join('')
      : `<tr><td colspan="6" style="padding:12px;text-align:center;color:#999;font-size:12px;">No open bulk-order requests.</td></tr>`;

    const subject = `[CFC] New order #${lo.orderNumber} — ${fmtMoney(Number(lo.total))} from ${lo.customerName}`;
    const year = new Date().getFullYear();

    const html = `
      <!DOCTYPE html>
      <html><body style="margin:0;padding:0;background:#faf9f6;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;padding:24px 0;">
          <tr><td align="center">
            <table width="720" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.05);">
              <tr><td style="background:#1a1a1a;padding:20px 28px;">
                <h1 style="margin:0;color:#B8860B;font-size:20px;letter-spacing:2px;">CFC · Owner Order Notification</h1>
              </td></tr>

              <tr><td style="padding:24px 28px;">
                <h2 style="margin:0 0 6px;font-size:18px;color:#1a1a1a;">New order placed — action required</h2>
                <p style="margin:0 0 18px;font-size:13px;color:#666;">Received on ${fmtDate(lo.createdAt)}</p>

                <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #f0ede6;border-radius:6px;margin:0 0 24px;">
                  <tr>
                    <td style="padding:10px 14px;background:#faf9f6;width:40%;font-size:12px;color:#888;">Order Number</td>
                    <td style="padding:10px 14px;background:#faf9f6;font-size:13px;"><strong>#${escapeHtml(lo.orderNumber)}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px;font-size:12px;color:#888;">Customer</td>
                    <td style="padding:10px 14px;font-size:13px;">${escapeHtml(lo.customerName)} &lt;${escapeHtml(lo.customerEmail)}&gt;</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px;background:#faf9f6;font-size:12px;color:#888;">Phone</td>
                    <td style="padding:10px 14px;background:#faf9f6;font-size:13px;">${escapeHtml(lo.customerPhone || '—')}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px;font-size:12px;color:#888;">Shipping City</td>
                    <td style="padding:10px 14px;font-size:13px;">${escapeHtml(lo.shippingCity || '—')}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px;background:#faf9f6;font-size:12px;color:#888;">Payment Method</td>
                    <td style="padding:10px 14px;background:#faf9f6;font-size:13px;">${escapeHtml(fmtMethod(lo.paymentMethod))}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px;font-size:12px;color:#888;">Status</td>
                    <td style="padding:10px 14px;font-size:13px;">${escapeHtml(lo.status)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px;background:#faf9f6;font-size:12px;color:#888;">Items / Total</td>
                    <td style="padding:10px 14px;background:#faf9f6;font-size:13px;"><strong>${lo.itemCount}</strong> item(s) · <strong>${fmtMoney(Number(lo.total))}</strong></td>
                  </tr>
                </table>

                <h3 style="margin:0 0 8px;font-size:14px;color:#1a1a1a;">Items</h3>
                <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #f0ede6;border-radius:6px;margin:0 0 28px;">
                  <thead><tr style="background:#faf9f6;">
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Product</th>
                    <th style="padding:8px 12px;text-align:center;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;width:60px;">Qty</th>
                    <th style="padding:8px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;width:120px;">Unit Price</th>
                  </tr></thead>
                  <tbody>${itemsRows}</tbody>
                </table>

                <h3 style="margin:0 0 8px;font-size:14px;color:#1a1a1a;">Other incomplete orders (${payload.incompleteOrders.length})</h3>
                <p style="margin:0 0 8px;font-size:12px;color:#666;">Orders that are not yet delivered, cancelled or refunded.</p>
                <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #f0ede6;border-radius:6px;margin:0 0 24px;">
                  <thead><tr style="background:#faf9f6;">
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Order #</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Customer</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">City</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Payment</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Status</th>
                    <th style="padding:8px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Total</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Placed</th>
                  </tr></thead>
                  <tbody>${incompleteRows}</tbody>
                </table>

                <h3 style="margin:0 0 8px;font-size:14px;color:#1a1a1a;">Open returns (${payload.pendingReturns.length})</h3>
                <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #f0ede6;border-radius:6px;margin:0 0 24px;">
                  <thead><tr style="background:#faf9f6;">
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">RMA #</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Order</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Customer</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Status</th>
                    <th style="padding:8px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Refund</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Requested</th>
                  </tr></thead>
                  <tbody>${returnRows}</tbody>
                </table>

                <h3 style="margin:0 0 8px;font-size:14px;color:#1a1a1a;">Open bulk-order requests (${payload.openBulkOrders.length})</h3>
                <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #f0ede6;border-radius:6px;margin:0 0 8px;">
                  <thead><tr style="background:#faf9f6;">
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Ref</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Customer</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Phone</th>
                    <th style="padding:8px 12px;text-align:center;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Items</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Status</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Requested</th>
                  </tr></thead>
                  <tbody>${bulkRows}</tbody>
                </table>
              </td></tr>

              <tr><td style="background:#faf9f6;padding:14px 28px;text-align:center;border-top:1px solid #f0ede6;">
                <p style="margin:0;font-size:11px;color:#999;">© ${year} Collation Foundation Curation · Internal owner notification</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body></html>`;

    const text = `New order placed: #${lo.orderNumber}
Customer: ${lo.customerName} <${lo.customerEmail}>
Phone: ${lo.customerPhone || '—'} · City: ${lo.shippingCity || '—'}
Payment: ${fmtMethod(lo.paymentMethod)} · Status: ${lo.status}
Items: ${lo.itemCount} · Total: ${fmtMoney(Number(lo.total))}
Placed: ${fmtDate(lo.createdAt)}

Other incomplete orders: ${payload.incompleteOrders.length}
Open returns: ${payload.pendingReturns.length}
Open bulk-order requests: ${payload.openBulkOrders.length}
`;

    return this.sendEmail({
      to: recipient,
      subject,
      text,
      html,
    });
  }
}
