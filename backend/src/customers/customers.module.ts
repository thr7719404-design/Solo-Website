import { Module } from '@nestjs/common';
import { CustomersController, CustomerAddressesController } from './customers.controller';
import { CustomersService } from './customers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CustomersController, CustomerAddressesController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
