import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';

/**
 * Webhook module is intentionally separate from StripeModule so that
 * StripeModule can stay free of any dependency on OrdersModule. This breaks
 * the OrdersModule ⇄ StripeModule cycle that previously required forwardRef
 * shims on both sides. StripeWebhookService initialises its own Stripe
 * instance (it only needs the secret key + webhook secret from config), so
 * it does not need to import StripeModule itself.
 */
@Module({
  imports: [ConfigModule, PrismaModule, OrdersModule],
  controllers: [StripeWebhookController],
  providers: [StripeWebhookService],
})
export class StripeWebhookModule {}
