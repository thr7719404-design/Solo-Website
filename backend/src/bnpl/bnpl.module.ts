import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TabbyService } from './tabby.service';
import { TamaraService } from './tamara.service';
import { BnplController } from './bnpl.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [ConfigModule, PrismaModule, forwardRef(() => OrdersModule)],
  controllers: [BnplController],
  providers: [TabbyService, TamaraService],
  exports: [TabbyService, TamaraService],
})
export class BnplModule {}
