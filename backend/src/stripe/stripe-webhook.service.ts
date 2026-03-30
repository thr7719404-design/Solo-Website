import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { InvoiceService } from '../orders/invoice.service';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private stripe: Stripe | null = null;
  private webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey && secretKey !== 'sk_test_your_stripe_secret_key') {
      this.stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as any });
    }
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    if (!this.webhookSecret) {
      throw new BadRequestException('Webhook secret is not configured');
    }
    return this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }

  async isEventProcessed(eventId: string): Promise<boolean> {
    const existing = await this.prisma.stripeEvent.findUnique({
      where: { id: eventId },
    });
    return existing?.processed === true;
  }

  async processEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.processPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await this.processChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async processPaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      this.logger.warn(`payment_intent.succeeded missing orderId in metadata: ${paymentIntent.id}`);
      return;
    }

    this.logger.log(`Processing payment success for order ${orderId} (PI: ${paymentIntent.id})`);

    // Update order status to PROCESSING (paid)
    await this.ordersService.updateOrderStatus(orderId, 'PROCESSING' as any, 'system');

    // Generate and persist invoice
    try {
      await this.invoiceService.generateInvoicePdf(orderId, undefined, true);
      this.logger.log(`Invoice generated for order ${orderId}`);
    } catch (err) {
      this.logger.error(`Invoice generation failed for order ${orderId}: ${err.message}`);
      // Don't rethrow — order is paid, invoice can be regenerated
    }
  }

  private async processChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const orderId = charge.metadata?.orderId;
    if (!orderId) {
      this.logger.warn(`charge.refunded missing orderId in metadata: ${charge.id}`);
      return;
    }

    this.logger.log(`Processing refund for order ${orderId} (Charge: ${charge.id})`);
    await this.ordersService.updateOrderStatus(orderId, 'REFUNDED' as any, 'system');
  }

  async saveEventRecord(
    eventId: string,
    type: string,
    payload: any,
    processed: boolean,
    error?: string,
  ): Promise<void> {
    await this.prisma.stripeEvent.upsert({
      where: { id: eventId },
      update: {
        processed,
        processedAt: processed ? new Date() : null,
        errorDetails: error || null,
      },
      create: {
        id: eventId,
        type,
        payload,
        processed,
        processedAt: processed ? new Date() : null,
        errorDetails: error || null,
      },
    });
  }
}
