import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getFullReport(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    return this.reportsService.getFullReport(Math.min(numDays, 365));
  }

  @Get('financial')
  async getFinancialSummary() {
    return this.reportsService.getFinancialSummary();
  }

  @Get('revenue')
  async getRevenueSeries(@Query('days') days?: string) {
    return this.reportsService.getRevenueTimeSeries(days ? parseInt(days, 10) : 30);
  }

  @Get('orders')
  async getOrderBreakdown() {
    return this.reportsService.getOrderBreakdown();
  }

  @Get('products')
  async getTopProducts(@Query('limit') limit?: string) {
    return this.reportsService.getTopProducts(limit ? parseInt(limit, 10) : 10);
  }

  @Get('stock')
  async getStockReport() {
    return this.reportsService.getStockReport();
  }

  @Get('customers')
  async getCustomerAnalytics(@Query('days') days?: string) {
    return this.reportsService.getCustomerAnalytics(days ? parseInt(days, 10) : 90);
  }

  @Get('vat')
  async getVatReport(@Query('days') days?: string) {
    return this.reportsService.getVatReport(days ? parseInt(days, 10) : 30);
  }

  @Get('categories')
  async getCategoryPerformance() {
    return this.reportsService.getCategoryPerformance();
  }

  @Get('promos')
  async getPromoReport() {
    return this.reportsService.getPromoReport();
  }
}
