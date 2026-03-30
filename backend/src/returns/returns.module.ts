import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StockModule } from '../stock/stock.module';
import { UsersModule } from '../users/users.module';
import { ReturnsService } from './returns.service';
import { ReturnsController, AdminReturnsController } from './returns.controller';

@Module({
  imports: [PrismaModule, StockModule, UsersModule],
  controllers: [ReturnsController, AdminReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
