import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { AdminUpdateReturnDto } from './dto/update-return.dto';

// ── Customer endpoints ──
@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  async createReturn(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReturnDto,
  ) {
    return this.returnsService.createReturn(userId, dto);
  }

  @Get()
  async getUserReturns(@CurrentUser('id') userId: string) {
    return this.returnsService.getUserReturns(userId);
  }

  @Get(':id')
  async getReturnById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.returnsService.getReturnById(id, userId);
  }

  @Delete(':id')
  async cancelReturn(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.returnsService.cancelReturn(id, userId);
  }
}

// ── Admin endpoints ──
@Controller('admin/returns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  async getReturns(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.returnsService.getAdminReturns({ status, search, page, limit });
  }

  @Get('stats')
  async getReturnStats() {
    return this.returnsService.getReturnStats();
  }

  @Get(':id')
  async getReturnById(@Param('id', ParseUUIDPipe) id: string) {
    return this.returnsService.getAdminReturnById(id);
  }

  @Patch(':id')
  async updateReturn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateReturnDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.returnsService.updateReturnStatus(id, dto, adminUserId);
  }
}
