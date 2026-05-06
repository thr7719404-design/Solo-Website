import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { StripeModule } from '../stripe/stripe.module';
import { SettingsModule } from '../settings/settings.module';
import { StockModule } from '../stock/stock.module';
import { MediaModule } from '../media/media.module';
import { EmailModule } from '../email/email.module';

@Module({
  // StripeModule no longer depends on OrdersModule (webhook is in StripeWebhookModule),
  // so we can import it directly without forwardRef.
  imports: [PrismaModule, UsersModule, StripeModule, forwardRef(() => SettingsModule), StockModule, MediaModule, EmailModule],
  controllers: [OrdersController],
  providers: [OrdersService, InvoiceService],
  exports: [OrdersService, InvoiceService],
})
export class OrdersModule {}
