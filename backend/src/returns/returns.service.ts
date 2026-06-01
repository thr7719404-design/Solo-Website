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
    const dateStr = today.toISOString().slice(0, 10).replaceAll(/-/g, '');
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
        status: { notIn: ['REJECTED', 'CANCELLED', 'CLOSED'] },
      },
    });
    if (existingReturn) {
      throw new BadRequestException('An active return request already exists for this order');
    }

    // Validate items
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item must be included in the return');
    }

    // Sum previously-returned quantities per orderItemId (across all non-rejected/non-cancelled returns)
    const priorReturnItems = await this.prisma.returnItem.findMany({
      where: {
        return: {
          orderId: dto.orderId,
          status: { notIn: ['REJECTED', 'CANCELLED'] },
        },
      },
      select: { orderItemId: true, quantity: true },
    });
    const alreadyReturned: Record<string, number> = {};
    for (const it of priorReturnItems) {
      alreadyReturned[it.orderItemId] = (alreadyReturned[it.orderItemId] ?? 0) + it.quantity;
    }

    let totalRefundAmount = 0;
    const returnItems = dto.items.map((item) => {
      const orderItem = order.items.find((oi) => oi.id === item.orderItemId);
      if (!orderItem) {
        throw new BadRequestException(`Order item ${item.orderItemId} not found`);
      }
      const priorQty = alreadyReturned[orderItem.id] ?? 0;
      const remaining = orderItem.quantity - priorQty;
      if (remaining <= 0) {
        throw new BadRequestException(
          `"${orderItem.name}" has already been fully returned`,
        );
      }
      if (item.quantity > remaining) {
        throw new BadRequestException(
          `Cannot return ${item.quantity} of "${orderItem.name}" — only ${remaining} remaining (${priorQty} of ${orderItem.quantity} already returned)`,
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
    const { status, search } = filters;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
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

      case 'PICKED_UP':
        break;

      case 'QC':
        // Restore stock for returned items after quality check passes
        if (!returnReq.stockRestored) {
          await this.restoreReturnStock(returnReq);
          updateData.stockRestored = true;
        }
        break;

      case 'CLOSED':
        updateData.completedAt = new Date();
        // Restore stock if QC step was skipped
        if (!returnReq.stockRestored) {
          try {
            await this.restoreReturnStock(returnReq);
            updateData.stockRestored = true;
          } catch (err: any) {
            this.logger.warn(`Stock restore skipped for return ${returnReq.returnNumber}: ${err?.message ?? err}`);
          }
        }
        // Process refund
        try {
          await this.processRefund(returnReq, dto.refundMethod ?? returnReq.refundMethod, dto.refundAmount ?? Number(returnReq.refundAmount));
        } catch (err: any) {
          this.logger.warn(`Refund processing failed for return ${returnReq.returnNumber}: ${err?.message ?? err}`);
        }
        // Reverse loyalty earned on the original order (proportional). Non-fatal — if the
        // customer's wallet has insufficient balance (e.g. they redeemed it already) we just
        // clamp to what's available and log, rather than failing the entire close.
        try {
          await this.reverseLoyaltyEarned(returnReq);
        } catch (err: any) {
          this.logger.warn(`Loyalty reversal skipped for return ${returnReq.returnNumber}: ${err?.message ?? err}`);
        }
        // Mark the order itself as RETURNED so no further returns can be submitted
        try {
          await this.prisma.order.update({
            where: { id: returnReq.orderId },
            data: { status: 'RETURNED' as any },
          });
          this.logger.log(`Order ${returnReq.order.orderNumber} marked as RETURNED`);
        } catch (err: any) {
          this.logger.warn(`Order status update failed for return ${returnReq.returnNumber}: ${err?.message ?? err}`);
        }
        break;

      case 'REJECTED':
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
      // Clamp to current balance so this never throws "Insufficient balance" on close.
      const wallet = await this.prisma.loyaltyWallet.findUnique({ where: { userId: returnReq.userId } });
      const currentBalance = Number(wallet?.balanceAed ?? 0);
      const actualDeduction = Math.min(loyaltyToDeduct, currentBalance);
      if (actualDeduction <= 0) {
        this.logger.log(`No loyalty to reverse for return ${returnReq.returnNumber} (wallet balance 0)`);
        return;
      }
      await this.loyaltyService.adjustLoyalty(
        returnReq.userId,
        -actualDeduction,
        `Loyalty reversal for return ${returnReq.returnNumber}`,
      );

      // Update the return record
      await this.prisma.return.update({
        where: { id: returnReq.id },
        data: { loyaltyDeducted: actualDeduction },
      });

      this.logger.log(
        `Reversed AED ${actualDeduction} loyalty for return ${returnReq.returnNumber} (${(proportion * 100).toFixed(0)}% of order)`,
      );
    }
  }

  /** Dashboard stats */
  async getReturnStats() {
    const [requested, approved, pickedUp, qc, closed, rejected, total] = await Promise.all([
      this.prisma.return.count({ where: { status: 'REQUESTED' } }),
      this.prisma.return.count({ where: { status: 'APPROVED' } }),
      this.prisma.return.count({ where: { status: 'PICKED_UP' } }),
      this.prisma.return.count({ where: { status: 'QC' } }),
      this.prisma.return.count({ where: { status: 'CLOSED' } }),
      this.prisma.return.count({ where: { status: 'REJECTED' } }),
      this.prisma.return.count(),
    ]);
    return { requested, approved, pickedUp, qc, closed, rejected, total };
  }
}
