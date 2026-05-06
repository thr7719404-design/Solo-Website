import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BulkOrdersService } from './bulk-orders.service';
import { CreateBulkOrderDto, UpdateBulkOrderStatusDto } from './dto';

@Controller('bulk-orders')
export class BulkOrdersController {
  private readonly logger = new Logger(BulkOrdersController.name);

  constructor(private readonly bulkOrdersService: BulkOrdersService) {}

  // ─── Public: submit a bulk order request (no auth) ───

  @Post()
  async create(@Body() dto: CreateBulkOrderDto) {
    this.logger.log(`New bulk order request from ${dto.email}`);
    return this.bulkOrdersService.create(dto);
  }

  // ─── Public: simple product search for the form ───
  // (Reuses the products table directly to keep it lightweight)

  // ─── Admin: list all bulk order requests ───

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.bulkOrdersService.findAll(
      page ? Number.parseInt(page, 10) : 1,
      limit ? Number.parseInt(limit, 10) : 20,
      status,
    );
  }

  // ─── Admin: get single bulk order request ───

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findOne(@Param('id') id: string) {
    return this.bulkOrdersService.findOne(id);
  }

  // ─── Admin: update status ───

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBulkOrderStatusDto,
  ) {
    this.logger.log(`Admin updating bulk order ${id} status to ${dto.status}`);
    return this.bulkOrdersService.updateStatus(id, dto);
  }

  // ─── Admin: delete bulk order request ───

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async remove(@Param('id') id: string) {
    return this.bulkOrdersService.remove(id);
  }
}
