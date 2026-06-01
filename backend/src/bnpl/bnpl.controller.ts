import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TabbyService } from './tabby.service';
import { TamaraService } from './tamara.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

class CreateBnplSessionDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

class SaveTabbyConfigDto {
  @IsString()
  @IsNotEmpty()
  secretKey: string;

  @IsString()
  @IsNotEmpty()
  publicKey: string;
}

class SaveTamaraConfigDto {
  @IsString()
  @IsNotEmpty()
  apiToken: string;

  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;
}

@Controller()
export class BnplController {
  private readonly logger = new Logger(BnplController.name);

  constructor(
    private readonly tabbyService: TabbyService,
    private readonly tamaraService: TamaraService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  // ─── Tabby Endpoints ───

  @Get('tabby/config')
  async getTabbyConfig() {
    return this.tabbyService.getPublicConfig();
  }

  @Post('tabby/create-session')
  @UseGuards(JwtAuthGuard)
  async createTabbySession(@Body() body: CreateBnplSessionDto, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const order = await this.prisma.order.findFirst({
      where: { id: body.orderId, userId },
      include: {
        items: true,
        shippingAddress: true,
        user: true,
      },
    }) as any;

    if (!order) throw new BadRequestException('Order not found');
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Order is not pending payment');
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'https://cfcgcc.com').split(',')[0].trim();
    const callbackBase = `${frontendUrl}/payment-callback`;

    const session = await this.tabbyService.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      currency: 'AED',
      buyer: {
        name: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Customer',
        email: order.user?.email || '',
        phone: order.shippingAddress?.phone || '',
      },
      shippingAddress: {
        city: order.shippingAddress?.city || '',
        address: order.shippingAddress?.addressLine1 || '',
        zip: order.shippingAddress?.postalCode || '',
      },
      items: order.items.map((item: any) => ({
        title: item.name || 'Product',
        quantity: item.quantity,
        unitPrice: Number(item.price),
        category: 'general',
      })),
      successUrl: `${callbackBase}?provider=tabby&status=success&order_id=${order.id}`,
      cancelUrl: `${callbackBase}?provider=tabby&status=cancel&order_id=${order.id}`,
      failureUrl: `${callbackBase}?provider=tabby&status=failure&order_id=${order.id}`,
    });

    // Save session ID on the order
    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentIntentId: `tabby_${session.sessionId}` },
    });

    return session;
  }

  @Post('tabby/verify/:orderId')
  @UseGuards(JwtAuthGuard)
  async verifyTabbyPayment(@Param('orderId') orderId: string, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) throw new BadRequestException('Order not found');

    const paymentRef = order.paymentIntentId;
    if (!paymentRef?.startsWith('tabby_')) {
      throw new BadRequestException('No Tabby session found for this order');
    }

    const sessionId = paymentRef.replace('tabby_', '');
    const payment = await this.tabbyService.getPayment(sessionId);

    if (payment.status === 'AUTHORIZED' || payment.status === 'CLOSED') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.AUTHORIZED,
          status: OrderStatus.PROCESSING,
        },
      });
      this.logger.log(`Tabby payment authorized for order ${orderId}`);
      return { status: 'authorized', message: 'Payment authorized successfully' };
    }

    return { status: payment.status?.toLowerCase(), message: `Payment status: ${payment.status}` };
  }

  @Post('tabby/webhook')
  async tabbyWebhook(@Body() body: any) {
    this.logger.log(`Tabby webhook received: ${JSON.stringify(body)}`);
    const paymentId = body.id || body.payment?.id;
    if (!paymentId) return { received: true };

    try {
      const order = await this.prisma.order.findFirst({
        where: { paymentIntentId: `tabby_${paymentId}` },
      });

      if (order && body.status === 'AUTHORIZED') {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.AUTHORIZED,
            status: OrderStatus.PROCESSING,
          },
        });
        this.logger.log(`Tabby webhook: order ${order.id} authorized`);
      }
    } catch (e) {
      this.logger.error(`Tabby webhook processing error: ${e}`);
    }

    return { received: true };
  }

  // Admin
  @Get('admin/tabby/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getTabbyAdminConfig() {
    return this.tabbyService.getAdminConfig();
  }

  @Post('admin/tabby/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async saveTabbyAdminConfig(@Body() body: SaveTabbyConfigDto) {
    await this.tabbyService.saveConfiguration(body.secretKey, body.publicKey);
    return { message: 'Tabby configuration saved' };
  }

  // ─── Tamara Endpoints ───

  @Get('tamara/config')
  async getTamaraConfig() {
    return this.tamaraService.getPublicConfig();
  }

  @Post('tamara/create-session')
  @UseGuards(JwtAuthGuard)
  async createTamaraSession(@Body() body: CreateBnplSessionDto, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const order = await this.prisma.order.findFirst({
      where: { id: body.orderId, userId },
      include: {
        items: true,
        shippingAddress: true,
        user: true,
      },
    }) as any;

    if (!order) throw new BadRequestException('Order not found');
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Order is not pending payment');
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'https://cfcgcc.com').split(',')[0].trim();
    const callbackBase = `${frontendUrl}/payment-callback`;

    const session = await this.tamaraService.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      currency: 'AED',
      buyer: {
        firstName: order.user?.firstName || 'Customer',
        lastName: order.user?.lastName || '',
        email: order.user?.email || '',
        phone: order.shippingAddress?.phone || '',
      },
      shippingAddress: {
        firstName: order.user?.firstName || '',
        lastName: order.user?.lastName || '',
        city: order.shippingAddress?.city || '',
        addressLine1: order.shippingAddress?.addressLine1 || '',
        countryCode: 'AE',
      },
      items: order.items.map((item: any) => ({
        name: item.name || 'Product',
        quantity: item.quantity,
        unitPrice: Number(item.price),
        sku: item.sku || undefined,
      })),
      successUrl: `${callbackBase}?provider=tamara&status=success&order_id=${order.id}`,
      cancelUrl: `${callbackBase}?provider=tamara&status=cancel&order_id=${order.id}`,
      failureUrl: `${callbackBase}?provider=tamara&status=failure&order_id=${order.id}`,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentIntentId: `tamara_${session.orderId}` },
    });

    return { sessionId: session.orderId, paymentUrl: session.checkoutUrl };
  }

  @Post('tamara/verify/:orderId')
  @UseGuards(JwtAuthGuard)
  async verifyTamaraPayment(@Param('orderId') orderId: string, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) throw new BadRequestException('Order not found');

    const paymentRef = order.paymentIntentId;
    if (!paymentRef?.startsWith('tamara_')) {
      throw new BadRequestException('No Tamara session found for this order');
    }

    const tamaraOrderId = paymentRef.replace('tamara_', '');

    try {
      await this.tamaraService.authoriseOrder(tamaraOrderId);
    } catch (e) {
      this.logger.warn(`Tamara authorise attempt: ${e}`);
    }

    const tamaraOrder = await this.tamaraService.getOrder(tamaraOrderId);

    if (tamaraOrder.status === 'approved' || tamaraOrder.status === 'authorised') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.AUTHORIZED,
          status: OrderStatus.PROCESSING,
        },
      });
      this.logger.log(`Tamara payment authorized for order ${orderId}`);
      return { status: 'authorized', message: 'Payment authorized successfully' };
    }

    return { status: tamaraOrder.status, message: `Payment status: ${tamaraOrder.status}` };
  }

  @Post('tamara/webhook')
  async tamaraWebhook(@Body() body: any) {
    this.logger.log(`Tamara webhook received: ${JSON.stringify(body)}`);
    const tamaraOrderId = body.order_id;
    if (!tamaraOrderId) return { received: true };

    try {
      const order = await this.prisma.order.findFirst({
        where: { paymentIntentId: `tamara_${tamaraOrderId}` },
      });

      if (order && (body.event_type === 'order_approved' || body.event_type === 'order_authorised')) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.AUTHORIZED,
            status: OrderStatus.PROCESSING,
          },
        });
        this.logger.log(`Tamara webhook: order ${order.id} authorized`);
      }
    } catch (e) {
      this.logger.error(`Tamara webhook processing error: ${e}`);
    }

    return { received: true };
  }

  // Admin
  @Get('admin/tamara/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getTamaraAdminConfig() {
    return this.tamaraService.getAdminConfig();
  }

  @Post('admin/tamara/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async saveTamaraAdminConfig(@Body() body: SaveTamaraConfigDto) {
    await this.tamaraService.saveConfiguration(body.apiToken, body.sandbox ?? false);
    return { message: 'Tamara configuration saved' };
  }
}
