import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('low-stock')
  async getLowStock(@Query('threshold') threshold?: string) {
    const thresholdNum = threshold ? Number.parseInt(threshold, 10) : undefined;
    return this.stockService.getLowStockProducts(thresholdNum);
  }

  @Get(':productId/availability')
  async getAvailability(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('quantity') quantity?: string,
  ) {
    const qty = quantity ? Number.parseInt(quantity, 10) : 1;
    return this.stockService.checkAvailability(productId, qty);
  }

  @Get(':productId/history')
  async getHistory(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stockService.getStockHistory(
      productId,
      page ? Number.parseInt(page, 10) : 1,
      limit ? Number.parseInt(limit, 10) : 50,
    );
  }

  @Post(':productId/adjust')
  async adjustStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: { quantity: number; reason: string },
    @Request() req: any,
  ) {
    return this.stockService.adjustStock(
      productId,
      body.quantity,
      body.reason,
      req.user.sub || req.user.id,
    );
  }

  @Post(':productId/set-stock')
  async setStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: { stockQty: number; reason: string },
    @Request() req: any,
  ) {
    return this.stockService.setStock(
      productId,
      body.stockQty,
      body.reason,
      req.user.sub || req.user.id,
    );
  }
}
