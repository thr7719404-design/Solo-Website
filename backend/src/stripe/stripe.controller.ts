import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePaymentIntentDto, SaveStripeConfigDto } from './dto/stripe.dto';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  /** Get publishable key and enabled status (public endpoint for storefront) */
  @Get('config')
  async getPublicConfig() {
    return this.stripeService.getPublicConfig();
  }

  /** Create a payment intent — returns clientSecret for Stripe.js frontend confirmation */
  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    const amountInCents = Math.round(dto.amount * 100);

    try {
      const paymentIntent = await this.stripeService.createPaymentIntent(
        amountInCents,
        dto.currency || 'aed',
        dto.metadata,
      );
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error: any) {
      const msg = error?.raw?.message || error?.message || 'Payment processing failed';
      throw new BadRequestException(msg);
    }
  }

  /** Verify a payment intent status (requires authenticated user) */
  @Post('verify-payment')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Body() body: { paymentIntentId: string }) {
    const paymentIntent = await this.stripeService.verifyPaymentIntent(body.paymentIntentId);
    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  /** Get Stripe configuration (admin only) */
  @Get('admin/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAdminConfig() {
    return this.stripeService.getAdminConfig();
  }

  /** Save Stripe configuration (admin only) */
  @Post('admin/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async saveConfig(@Body() dto: SaveStripeConfigDto) {
    await this.stripeService.saveConfiguration(
      dto.secretKey,
      dto.publishableKey,
      dto.webhookSecret,
    );
    return { message: 'Stripe configuration saved successfully' };
  }
}
