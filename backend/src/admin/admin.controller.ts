import { Controller, Get, Patch, Param, Query, Body, Res, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, OrderStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { InvoiceService } from '../orders/invoice.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { Response } from 'express';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Get('stats')
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }

  @Get('orders/:id/invoice/pdf')
  async getOrderInvoicePdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.invoiceService.generateInvoicePdf(
      id,
      undefined,
      true, // isAdmin
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    const order = await this.adminService.getOrderById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Get('orders')
  async getOrders(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getOrders({
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
    });
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string; trackingNumber?: string },
  ) {
    const validStatuses = Object.values(OrderStatus);
    if (!body.status || !validStatuses.includes(body.status as OrderStatus)) {
      throw new BadRequestException(`Invalid status. Valid values: ${validStatuses.join(', ')}`);
    }

    const order = await this.adminService.updateOrderStatus(id, {
      status: body.status as OrderStatus,
      notes: body.notes,
      trackingNumber: body.trackingNumber,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
