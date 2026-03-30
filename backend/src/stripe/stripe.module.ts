import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [ConfigModule, PrismaModule, forwardRef(() => OrdersModule)],
  controllers: [StripeController, StripeWebhookController],
  providers: [StripeService, StripeWebhookService],
  exports: [StripeService],
})
export class StripeModule {}
