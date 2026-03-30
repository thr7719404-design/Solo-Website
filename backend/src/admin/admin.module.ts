import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [AdminController, ReportsController],
  providers: [AdminService, ReportsService],
})
export class AdminModule {}
