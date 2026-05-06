import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnnouncementsService } from './announcements.service';
import {
  AnnouncementsPublicController,
  AnnouncementsAdminController,
} from './announcements.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AnnouncementsPublicController, AnnouncementsAdminController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
