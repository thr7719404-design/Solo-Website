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
    const numDays = days ? Number.parseInt(days, 10) : 30;
    return this.reportsService.getFullReport(Math.min(numDays, 365));
  }

  @Get('financial')
  async getFinancialSummary() {
    return this.reportsService.getFinancialSummary();
  }

  @Get('revenue')
  async getRevenueSeries(@Query('days') days?: string) {
    return this.reportsService.getRevenueTimeSeries(days ? Number.parseInt(days, 10) : 30);
  }

  @Get('orders')
  async getOrderBreakdown() {
    return this.reportsService.getOrderBreakdown();
  }

  @Get('products')
  async getTopProducts(@Query('limit') limit?: string) {
    return this.reportsService.getTopProducts(limit ? Number.parseInt(limit, 10) : 10);
  }

  @Get('stock')
  async getStockReport() {
    return this.reportsService.getStockReport();
  }

  @Get('customers')
  async getCustomerAnalytics(@Query('days') days?: string) {
    return this.reportsService.getCustomerAnalytics(days ? Number.parseInt(days, 10) : 90);
  }

  @Get('vat')
  async getVatReport(@Query('days') days?: string) {
    return this.reportsService.getVatReport(days ? Number.parseInt(days, 10) : 30);
  }

  @Get('categories')
  async getCategoryPerformance() {
    return this.reportsService.getCategoryPerformance();
  }

  @Get('promos')
  async getPromoReport() {
    return this.reportsService.getPromoReport();
  }

  // ---- Extended holistic reports ----

  @Get('refunds')
  async getRefunds(@Query('days') days?: string) {
    return this.reportsService.getRefundReport(days ? Number.parseInt(days, 10) : 30);
  }

  @Get('inventory-value')
  async getInventoryValue() {
    return this.reportsService.getInventoryValuation();
  }

  @Get('catalog-health')
  async getCatalogHealth() {
    return this.reportsService.getCatalogHealth();
  }

  @Get('slow-movers')
  async getSlowMovers(@Query('days') days?: string, @Query('limit') limit?: string) {
    return this.reportsService.getSlowMovers(
      days ? Number.parseInt(days, 10) : 90,
      limit ? Number.parseInt(limit, 10) : 30,
    );
  }

  @Get('returns-by-product')
  async getReturnsByProduct(@Query('days') days?: string) {
    return this.reportsService.getReturnsByProduct(days ? Number.parseInt(days, 10) : 30);
  }

  @Get('revenue-by-brand')
  async getRevenueByBrand(@Query('days') days?: string) {
    return this.reportsService.getRevenueByBrand(days ? Number.parseInt(days, 10) : 30);
  }

  @Get('subcategory-performance')
  async getSubcategoryPerformance(@Query('days') days?: string) {
    return this.reportsService.getSubcategoryPerformance(days ? Number.parseInt(days, 10) : 30);
  }

  @Get('fulfillment')
  async getFulfillment(@Query('days') days?: string) {
    return this.reportsService.getFulfillmentSLA(days ? Number.parseInt(days, 10) : 30);
  }

  @Get('stuck-orders')
  async getStuckOrders() {
    return this.reportsService.getStuckOrders();
  }

  @Get('abandoned-carts')
  async getAbandonedCarts(@Query('days') days?: string) {
    return this.reportsService.getAbandonedCarts(days ? Number.parseInt(days, 10) : 7);
  }

  @Get('failed-payments')
  async getFailedPayments(@Query('days') days?: string) {
    return this.reportsService.getFailedPayments(days ? Number.parseInt(days, 10) : 30);
  }

  @Get('loyalty')
  async getLoyaltyHealth() {
    return this.reportsService.getLoyaltyHealth();
  }

  @Get('signup-funnel')
  async getSignupFunnel(@Query('days') days?: string) {
    return this.reportsService.getSignupFunnel(days ? Number.parseInt(days, 10) : 30);
  }

  @Get('repeat-rate')
  async getRepeatRate(@Query('days') days?: string) {
    return this.reportsService.getRepeatPurchaseRate(days ? Number.parseInt(days, 10) : 90);
  }

  @Get('bulk-orders')
  async getBulkOrders(@Query('days') days?: string) {
    return this.reportsService.getBulkOrderReport(days ? Number.parseInt(days, 10) : 90);
  }

  @Get('invoices')
  async getInvoiceReport(@Query('days') days?: string) {
    return this.reportsService.getInvoiceReport(days ? Number.parseInt(days, 10) : 30);
  }

  @Get('order-pipeline')
  async getOrderPipeline(@Query('days') days?: string) {
    return this.reportsService.getOrderPipeline(days ? Number.parseInt(days, 10) : 30);
  }

  @Get('featured-performance')
  async getFeaturedPerformance(@Query('days') days?: string) {
    return this.reportsService.getFeaturedPerformance(days ? Number.parseInt(days, 10) : 30);
  }
}
