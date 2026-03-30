import { Controller, Post, Get, Body, Param, UseGuards, Req, Res } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Request, Response } from 'express';

interface AuthRequest extends Request {
  user: { id: string; email: string; role: string };
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(@Req() req: AuthRequest, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getOrders(@Req() req: AuthRequest) {
    return this.ordersService.getOrders(req.user.id);
  }

  @Get(':id/invoice/download')
  @UseGuards(JwtAuthGuard)
  async downloadInvoice(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const result = await this.invoiceService.getInvoiceDownload(id, req.user.id, isAdmin);

    if ('redirectUrl' in result) {
      return res.redirect(result.redirectUrl);
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.buffer.length,
    });
    res.end(result.buffer);
  }

  @Get(':id/invoice/pdf')
  @UseGuards(JwtAuthGuard)
  async getInvoicePdf(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.invoiceService.generateInvoicePdf(
      id,
      req.user.id,
      false,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrder(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.ordersService.getOrderById(req.user.id, id);
  }
}
