import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BulkOrdersService } from './bulk-orders.service';
import { BulkOrdersController } from './bulk-orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ConfigModule, PrismaModule, EmailModule],
  controllers: [BulkOrdersController],
  providers: [BulkOrdersService],
  exports: [BulkOrdersService],
})
export class BulkOrdersModule {}
