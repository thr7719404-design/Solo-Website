import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { EmailService } from './email/email.service';

class ContactDto {
  @IsString() @MinLength(1) @MaxLength(120) name: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(200) subject?: string;
  @IsString() @MinLength(1) @MaxLength(5000) message: string;
}

@Controller()
export class AppController {
  constructor(private readonly emailService: EmailService) {}

  @Get()
  getRoot() {
    return {
      message: 'Solo Ecommerce Backend API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        api: '/api',
        products: '/api/products',
        auth: '/api/auth',
        users: '/api/users',
        docs: '/api/docs',
        health: '/api/health',
      },
    };
  }

  @Post('contact')
  @HttpCode(200)
  async submitContact(@Body() dto: ContactDto) {
    const adminEmail = 'info@solotestsite.site';
    const subject = (dto.subject?.trim() || `Website inquiry from ${dto.name}`).slice(0, 200);
    const html = `
      <h2 style="margin:0 0 16px">New Contact Form Submission</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">Name</td><td style="padding:6px 12px">${dto.name}</td></tr>
        ${dto.email ? `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">Email</td><td style="padding:6px 12px"><a href="mailto:${dto.email}">${dto.email}</a></td></tr>` : ''}
        ${dto.phone ? `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">Phone</td><td style="padding:6px 12px">${dto.phone}</td></tr>` : ''}
        ${dto.subject ? `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">Subject</td><td style="padding:6px 12px">${dto.subject}</td></tr>` : ''}
        <tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">Message</td><td style="padding:6px 12px;white-space:pre-wrap">${dto.message.replaceAll('<','&lt;').replaceAll('>','&gt;')}</td></tr>
      </table>
    `;
    await this.emailService.sendEmail({ to: adminEmail, subject, html });
    return { success: true };
  }
}
