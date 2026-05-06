import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ProductGroupsController } from './product-groups/product-groups.controller';
import { ProductGroupsService } from './product-groups/product-groups.service';
import { SeedImagesController } from './seed-images.controller';
import { SeedImagesService } from './seed-images.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [PrismaModule, OrdersModule, UsersModule, MediaModule],
  controllers: [AdminController, ReportsController, ProductGroupsController, SeedImagesController],
  providers: [AdminService, ReportsService, ProductGroupsService, SeedImagesService],
})
export class AdminModule {}
