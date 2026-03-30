import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initStripe();
  }

  private async initStripe() {
    const secretKey = await this.getSecretKey();
    if (secretKey && secretKey !== 'sk_test_your_stripe_secret_key') {
      this.stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as any });
      this.logger.log('Stripe initialized successfully');
    } else {
      this.logger.warn('Stripe not configured - payment features disabled');
    }
  }

  private async getSecretKey(): Promise<string | null> {
    // First check DB site_settings, fallback to env
    try {
      const setting = await this.prisma.siteSetting.findUnique({
        where: { key: 'stripe_secret_key' },
      });
      if (setting?.value && setting.value !== 'sk_test_your_stripe_secret_key') {
        return setting.value;
      }
    } catch (e) {
      // Table might not exist yet
    }
    return this.configService.get<string>('STRIPE_SECRET_KEY') || null;
  }

  private async getPublishableKey(): Promise<string | null> {
    try {
      const setting = await this.prisma.siteSetting.findUnique({
        where: { key: 'stripe_publishable_key' },
      });
      if (setting?.value) return setting.value;
    } catch (e) {}
    return this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') || null;
  }

  private getStripeInstance(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured. Please set up Stripe keys in Admin > Stripe Configuration.');
    }
    return this.stripe;
  }

  /** Reinitialize Stripe (after config update) */
  async reinitialize(): Promise<void> {
    const secretKey = await this.getSecretKey();
    if (secretKey && secretKey !== 'sk_test_your_stripe_secret_key') {
      this.stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as any });
      this.logger.log('Stripe re-initialized with updated keys');
    } else {
      this.stripe = null;
      this.logger.warn('Stripe disabled - invalid or missing secret key');
    }
  }

  /** Create a payment intent for checkout */
  async createPaymentIntent(amountInCents: number, currency: string = 'aed', metadata?: Record<string, string>): Promise<Stripe.PaymentIntent> {
    const stripe = this.getStripeInstance();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: metadata || {},
    });

    this.logger.log(`PaymentIntent created: ${paymentIntent.id} for ${amountInCents} ${currency}`);
    return paymentIntent;
  }

  /** Create a payment intent and confirm it with card details server-side (test-mode safe) */
  async createAndConfirmPayment(
    amountInCents: number,
    currency: string = 'aed',
    cardNumber: string,
    expMonth: number,
    expYear: number,
    cvc: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    const stripe = this.getStripeInstance();

    // Create a PaymentMethod with the card details
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber.replace(/\s+/g, ''),
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvc,
      },
    });

    // Create and confirm the PaymentIntent in one step
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      payment_method: paymentMethod.id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: metadata || {},
    });

    this.logger.log(`PaymentIntent created and confirmed: ${paymentIntent.id} for ${amountInCents} ${currency} - status: ${paymentIntent.status}`);
    return paymentIntent;
  }

  /** Confirm that a payment intent has succeeded */
  async verifyPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = this.getStripeInstance();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  }

  /** Get Stripe config (publishable key, enabled status) - safe for client */
  async getPublicConfig(): Promise<{ publishableKey: string | null; isEnabled: boolean }> {
    const publishableKey = await this.getPublishableKey();
    return {
      publishableKey,
      isEnabled: this.stripe !== null,
    };
  }

  /** Save Stripe configuration to site_settings */
  async saveConfiguration(secretKey: string, publishableKey: string, webhookSecret?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.upsertSetting(tx, 'stripe_secret_key', secretKey, 'stripe', 'Secret Key');
      await this.upsertSetting(tx, 'stripe_publishable_key', publishableKey, 'stripe', 'Publishable Key');
      if (webhookSecret) {
        await this.upsertSetting(tx, 'stripe_webhook_secret', webhookSecret, 'stripe', 'Webhook Secret');
      }
      await this.upsertSetting(tx, 'stripe_enabled', 'true', 'stripe', 'Enabled');
    });

    // Reinitialize with new keys
    await this.reinitialize();
  }

  /** Get admin config (masked keys) */
  async getAdminConfig(): Promise<{
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    isEnabled: boolean;
  }> {
    const settings = await this.prisma.siteSetting.findMany({
      where: { group: 'stripe' },
    });

    const getValue = (key: string) => settings.find(s => s.key === key)?.value || '';
    const secretKey = getValue('stripe_secret_key');
    const publishableKey = getValue('stripe_publishable_key');
    const webhookSecret = getValue('stripe_webhook_secret');

    return {
      secretKey: secretKey ? this.maskKey(secretKey) : '',
      publishableKey: publishableKey || '',
      webhookSecret: webhookSecret ? this.maskKey(webhookSecret) : '',
      isEnabled: getValue('stripe_enabled') === 'true',
    };
  }

  private maskKey(key: string): string {
    if (key.length <= 12) return '****';
    return key.substring(0, 8) + '****' + key.substring(key.length - 4);
  }

  private async upsertSetting(
    tx: any,
    key: string,
    value: string,
    group: string,
    label: string,
  ): Promise<void> {
    await tx.siteSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value, type: 'string', group, label },
    });
  }
}
