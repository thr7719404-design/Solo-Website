import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { LoyaltyService } from '../users/loyalty.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { AdminUpdateReturnDto } from './dto/update-return.dto';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  /** Generate return number like RMA-20260327-0001 */
  private async generateReturnNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.return.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        },
      },
    });
    return `RMA-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  /** Customer creates a return request */
  async createReturn(userId: string, dto: CreateReturnDto) {
    // Validate order belongs to user
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only delivered orders can be returned
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    // Check 30-day return window
    if (order.deliveredAt) {
      const daysSinceDelivery = Math.floor(
        (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceDelivery > 30) {
        throw new BadRequestException('Return window has expired (30 days from delivery)');
      }
    }

    // Check no existing active return for this order
    const existingReturn = await this.prisma.return.findFirst({
      where: {
        orderId: dto.orderId,
        status: { notIn: ['REJECTED', 'CANCELLED', 'COMPLETED'] },
      },
    });
    if (existingReturn) {
      throw new BadRequestException('An active return request already exists for this order');
    }

    // Validate items
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item must be included in the return');
    }

    let totalRefundAmount = 0;
    const returnItems = dto.items.map((item) => {
      const orderItem = order.items.find((oi) => oi.id === item.orderItemId);
      if (!orderItem) {
        throw new BadRequestException(`Order item ${item.orderItemId} not found`);
      }
      if (item.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Cannot return ${item.quantity} of "${orderItem.name}" — only ${orderItem.quantity} were ordered`,
        );
      }
      const unitPrice = Number(orderItem.price);
      const subtotal = unitPrice * item.quantity;
      totalRefundAmount += subtotal;

      return {
        orderItemId: orderItem.id,
        productId: orderItem.productId,
        name: orderItem.name,
        sku: orderItem.sku,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      };
    });

    const returnNumber = await this.generateReturnNumber();

    const created = await this.prisma.return.create({
      data: {
        returnNumber,
        orderId: dto.orderId,
        userId,
        reason: dto.reason,
        customerNotes: dto.customerNotes,
        refundAmount: totalRefundAmount,
        items: {
          create: returnItems,
        },
      },
      include: { items: true, order: { select: { orderNumber: true } } },
    });

    this.logger.log(`Return ${returnNumber} created for order ${order.orderNumber}`);
    return created;
  }

  /** Customer: get their returns */
  async getUserReturns(userId: string) {
    return this.prisma.return.findMany({
      where: { userId },
      include: {
        items: true,
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Customer: get single return detail */
  async getReturnById(returnId: string, userId: string) {
    const returnReq = await this.prisma.return.findFirst({
      where: { id: returnId, userId },
      include: {
        items: true,
        order: { select: { orderNumber: true, createdAt: true, total: true } },
      },
    });
    if (!returnReq) throw new NotFoundException('Return not found');
    return returnReq;
  }

  /** Customer: cancel their own pending return */
  async cancelReturn(returnId: string, userId: string) {
    const returnReq = await this.prisma.return.findFirst({
      where: { id: returnId, userId },
    });
    if (!returnReq) throw new NotFoundException('Return not found');
    if (returnReq.status !== 'REQUESTED') {
      throw new BadRequestException('Only pending return requests can be cancelled');
    }

    return this.prisma.return.update({
      where: { id: returnId },
      data: { status: 'CANCELLED' },
      include: { items: true },
    });
  }

  // ── Admin methods ──

  /** Admin: list all returns with filters */
  async getAdminReturns(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 20 } = filters;
    const where: any = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { returnNumber: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [returns, total] = await Promise.all([
      this.prisma.return.findMany({
        where,
        include: {
          items: true,
          order: { select: { orderNumber: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.return.count({ where }),
    ]);

    return {
      data: returns,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Admin: get single return detail */
  async getAdminReturnById(returnId: string) {
    const returnReq = await this.prisma.return.findUnique({
      where: { id: returnId },
      include: {
        items: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            total: true,
            subtotal: true,
            loyaltyEarnAed: true,
            loyaltyRedeemAed: true,
            paymentMethod: true,
            paymentIntentId: true,
            items: true,
          },
        },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!returnReq) throw new NotFoundException('Return not found');
    return returnReq;
  }

  /** Admin: update return status with side-effects */
  async updateReturnStatus(returnId: string, dto: AdminUpdateReturnDto, adminUserId: string) {
    const returnReq = await this.prisma.return.findUnique({
      where: { id: returnId },
      include: {
        items: true,
        order: {
          include: { items: true },
        },
      },
    });
    if (!returnReq) throw new NotFoundException('Return not found');

    const updateData: any = {
      status: dto.status,
      adminNotes: dto.adminNotes ?? returnReq.adminNotes,
    };

    if (dto.refundMethod) updateData.refundMethod = dto.refundMethod;
    if (dto.refundAmount !== undefined) updateData.refundAmount = dto.refundAmount;

    // Status-specific side effects
    switch (dto.status) {
      case 'APPROVED':
        updateData.approvedAt = new Date();
        break;

      case 'ITEMS_RECEIVED':
        updateData.receivedAt = new Date();
        // Restore stock for returned items
        if (!returnReq.stockRestored) {
          await this.restoreReturnStock(returnReq);
          updateData.stockRestored = true;
        }
        break;

      case 'COMPLETED':
        updateData.completedAt = new Date();
        // Process refund
        await this.processRefund(returnReq, dto.refundMethod ?? returnReq.refundMethod, dto.refundAmount ?? Number(returnReq.refundAmount));
        // Reverse loyalty earned on the original order (proportional)
        await this.reverseLoyaltyEarned(returnReq);
        break;

      case 'REJECTED':
        // If stock was already restored (edge case), we don't un-restore
        break;

      case 'CANCELLED':
        break;
    }

    const updated = await this.prisma.return.update({
      where: { id: returnId },
      data: updateData,
      include: {
        items: true,
        order: { select: { orderNumber: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    this.logger.log(`Return ${returnReq.returnNumber} updated to ${dto.status} by admin ${adminUserId}`);
    return updated;
  }

  /** Restore stock for returned items */
  private async restoreReturnStock(returnReq: any) {
    for (const item of returnReq.items) {
      if (item.productId) {
        await this.stockService.restoreStock(
          item.productId,
          item.quantity,
          returnReq.orderId,
        );
        this.logger.log(
          `Stock restored: +${item.quantity} of product ${item.productId} for return ${returnReq.returnNumber}`,
        );
      }
    }
  }

  /** Process the refund based on method */
  private async processRefund(returnReq: any, refundMethod: string, refundAmount: number) {
    switch (refundMethod) {
      case 'LOYALTY_CASH':
      case 'STORE_CREDIT':
        // Add refund amount as loyalty cash
        await this.loyaltyService.addLoyaltyCash(
          returnReq.userId,
          refundAmount,
          returnReq.orderId,
          `Refund for return ${returnReq.returnNumber}`,
        );
        this.logger.log(`Refund AED ${refundAmount} added as loyalty cash for return ${returnReq.returnNumber}`);
        break;

      case 'ORIGINAL_PAYMENT':
        // For Stripe refunds, this would call stripeService.refund()
        // For COD, admin handles manually
        this.logger.log(`Refund AED ${refundAmount} to original payment for return ${returnReq.returnNumber} — requires manual processing`);
        break;
    }
  }

  /** Reverse the loyalty earned on the original order, proportional to returned items */
  private async reverseLoyaltyEarned(returnReq: any) {
    const order = returnReq.order;
    const loyaltyEarned = Number(order.loyaltyEarnAed ?? 0);
    if (loyaltyEarned <= 0) return;

    // Calculate proportion: how much of the order subtotal is being returned
    const orderSubtotal = Number(order.subtotal);
    if (orderSubtotal <= 0) return;

    const returnSubtotal = returnReq.items.reduce(
      (sum: number, item: any) => sum + Number(item.subtotal),
      0,
    );
    const proportion = Math.min(returnSubtotal / orderSubtotal, 1);
    const loyaltyToDeduct = Math.round(loyaltyEarned * proportion * 100) / 100;

    if (loyaltyToDeduct > 0) {
      await this.loyaltyService.adjustLoyalty(
        returnReq.userId,
        -loyaltyToDeduct,
        `Loyalty reversal for return ${returnReq.returnNumber}`,
      );

      // Update the return record
      await this.prisma.return.update({
        where: { id: returnReq.id },
        data: { loyaltyDeducted: loyaltyToDeduct },
      });

      this.logger.log(
        `Reversed AED ${loyaltyToDeduct} loyalty for return ${returnReq.returnNumber} (${(proportion * 100).toFixed(0)}% of order)`,
      );
    }
  }

  /** Dashboard stats */
  async getReturnStats() {
    const [requested, approved, processing, completed, total] = await Promise.all([
      this.prisma.return.count({ where: { status: 'REQUESTED' } }),
      this.prisma.return.count({ where: { status: 'APPROVED' } }),
      this.prisma.return.count({ where: { status: { in: ['ITEMS_RECEIVED', 'REFUND_PROCESSING'] } } }),
      this.prisma.return.count({ where: { status: 'COMPLETED' } }),
      this.prisma.return.count(),
    ]);
    return { requested, approved, processing, completed, total };
  }
}
