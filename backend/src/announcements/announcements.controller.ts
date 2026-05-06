import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

/** Public endpoint — no auth required */
@Controller('announcements')
export class AnnouncementsPublicController {
  constructor(private readonly svc: AnnouncementsService) {}

  @Get('active')
  getActive() {
    return this.svc.getActive();
  }
}

/** Admin CRUD */
@Controller('admin/announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AnnouncementsAdminController {
  constructor(private readonly svc: AnnouncementsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? Math.max(1, Number.parseInt(page, 10) || 1) : 1;
    const parsedLimit = limit ? Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 100)) : 100;
    return this.svc.findAll({ page: parsedPage, limit: parsedLimit });
  }

  @Get('promo-codes-list')
  promoCodesList() {
    return this.svc.listPromoCodes();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAnnouncementDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
