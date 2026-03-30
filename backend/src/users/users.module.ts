import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { LoyaltyService } from './loyalty.service';
import { PaymentMethodsService } from './payment-methods.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, LoyaltyService, PaymentMethodsService],
  exports: [UsersService, LoyaltyService, PaymentMethodsService],
})
export class UsersModule {}
