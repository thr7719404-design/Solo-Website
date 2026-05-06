import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, StockMovementType } from '@prisma/client';

interface StockItem {
  productId: number;
  quantity: number;
}

/**
 * Prisma transaction client type. Methods that mutate stock accept an optional
 * `tx` so callers can enroll the work in an existing $transaction (avoids the
 * nested-transaction split-brain problem where an inner self-managed
 * transaction commits even after the outer one rolls back).
 */
type TxClient = Prisma.TransactionClient;

export interface AvailabilityResult {
  productId: number;
  name: string;
  stockQty: number;
  reservedQty: number;
  available: number;
  requested: number;
  isAvailable: boolean;
}

interface BulkAvailabilityResult {
  allAvailable: boolean;
  results: AvailabilityResult[];
  unavailable: AvailabilityResult[];
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkAvailability(productId: number, quantity: number): Promise<AvailabilityResult> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, productName: true, stockQty: true, reservedQty: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const available = product.stockQty - product.reservedQty;

    return {
      productId: product.id,
      name: product.productName,
      stockQty: product.stockQty,
      reservedQty: product.reservedQty,
      available,
      requested: quantity,
      isAvailable: available >= quantity,
    };
  }

  async checkBulkAvailability(items: StockItem[]): Promise<BulkAvailabilityResult> {
    const productIds = items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productName: true, stockQty: true, reservedQty: true },
    });

    const results: AvailabilityResult[] = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return {
          productId: item.productId,
          name: 'Unknown',
          stockQty: 0,
          reservedQty: 0,
          available: 0,
          requested: item.quantity,
          isAvailable: false,
        };
      }
      const available = product.stockQty - product.reservedQty;
      return {
        productId: product.id,
        name: product.productName,
        stockQty: product.stockQty,
        reservedQty: product.reservedQty,
        available,
        requested: item.quantity,
        isAvailable: available >= item.quantity,
      };
    });

    const unavailable = results.filter(r => !r.isAvailable);

    return {
      allAvailable: unavailable.length === 0,
      results,
      unavailable,
    };
  }

  async reserveStock(productId: number, quantity: number, orderId: string, userId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, productName: true, stockQty: true, reservedQty: true },
      });

      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const available = product.stockQty - product.reservedQty;
      if (available < quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.productName}: requested ${quantity}, available ${available}`,
        );
      }

      await tx.product.update({
        where: { id: productId },
        data: { reservedQty: { increment: quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          type: StockMovementType.ORDER_RESERVE,
          reference: orderId,
          notes: `Reserved ${quantity} units for order ${orderId}`,
          createdBy: userId,
        },
      });

      this.logger.log(`Reserved ${quantity} of product ${productId} for order ${orderId}`);
    });
  }

  async reserveStockBatch(items: StockItem[], orderId: string, userId?: string, tx?: TxClient): Promise<void> {
    const run = async (client: TxClient | PrismaService) => {
      for (const item of items) {
        // Atomic conditional update: increment reservedQty only if (stock_qty - reserved_qty) >= quantity.
        // This eliminates the TOCTOU race between read-check and write that the previous
        // findUnique-then-update pattern allowed (two concurrent buyers of the last unit).
        const updated = await client.$executeRaw`
          UPDATE products
          SET reserved_qty = reserved_qty + ${item.quantity}, updated_at = NOW()
          WHERE id = ${item.productId} AND (stock_qty - reserved_qty) >= ${item.quantity}
        `;

        if (updated === 0) {
          // Either product missing or insufficient stock — fetch to give a precise error.
          const product = await client.product.findUnique({
            where: { id: item.productId },
            select: { id: true, productName: true, stockQty: true, reservedQty: true },
          });
          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }
          const available = product.stockQty - product.reservedQty;
          throw new BadRequestException(
            `Insufficient stock for ${product.productName}: requested ${item.quantity}, available ${available}`,
          );
        }

        await client.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: StockMovementType.ORDER_RESERVE,
            reference: orderId,
            notes: `Reserved ${item.quantity} units for order ${orderId}`,
            createdBy: userId,
          },
        });
      }

      this.logger.log(`Batch reserved stock for ${items.length} products on order ${orderId}`);
    };

    // If caller passed a transaction client, enroll in it (correct, single transaction).
    // Otherwise open our own.
    if (tx) {
      await run(tx);
    } else {
      await this.prisma.$transaction(async (innerTx) => run(innerTx));
    }
  }

  async confirmReservation(productId: number, quantity: number, orderId: string, userId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          stockQty: { decrement: quantity },
          reservedQty: { decrement: quantity },
        },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          type: StockMovementType.ORDER_CONFIRM,
          reference: orderId,
          notes: `Confirmed ${quantity} units for order ${orderId}`,
          createdBy: userId,
        },
      });

      this.logger.log(`Confirmed reservation of ${quantity} for product ${productId}, order ${orderId}`);
    });
  }

  async confirmReservationBatch(items: StockItem[], orderId: string, userId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: { decrement: item.quantity },
            reservedQty: { decrement: item.quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: StockMovementType.ORDER_CONFIRM,
            reference: orderId,
            notes: `Confirmed ${item.quantity} units for order ${orderId}`,
            createdBy: userId,
          },
        });
      }

      this.logger.log(`Batch confirmed reservation for ${items.length} products on order ${orderId}`);
    });
  }

  async releaseReservation(productId: number, quantity: number, orderId: string, userId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { reservedQty: { decrement: quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          type: StockMovementType.ORDER_CANCEL,
          reference: orderId,
          notes: `Released reservation of ${quantity} units for cancelled order ${orderId}`,
          createdBy: userId,
        },
      });

      this.logger.log(`Released reservation of ${quantity} for product ${productId}, order ${orderId}`);
    });
  }

  async releaseReservationBatch(items: StockItem[], orderId: string, userId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { reservedQty: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: StockMovementType.ORDER_CANCEL,
            reference: orderId,
            notes: `Released reservation of ${item.quantity} units for cancelled order ${orderId}`,
            createdBy: userId,
          },
        });
      }

      this.logger.log(`Batch released reservation for ${items.length} products on order ${orderId}`);
    });
  }

  async restoreStock(productId: number, quantity: number, orderId: string, userId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { stockQty: { increment: quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          type: StockMovementType.ORDER_REFUND,
          reference: orderId,
          notes: `Restored ${quantity} units for refunded order ${orderId}`,
          createdBy: userId,
        },
      });

      this.logger.log(`Restored ${quantity} stock for product ${productId}, order ${orderId}`);
    });
  }

  async restoreStockBatch(items: StockItem[], orderId: string, userId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: StockMovementType.ORDER_REFUND,
            reference: orderId,
            notes: `Restored ${item.quantity} units for refunded order ${orderId}`,
            createdBy: userId,
          },
        });
      }

      this.logger.log(`Batch restored stock for ${items.length} products on order ${orderId}`);
    });
  }

  async adjustStock(
    productId: number,
    quantity: number,
    reason: string,
    userId: string,
  ): Promise<{ newStockQty: number }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, productName: true, stockQty: true },
      });

      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const newStockQty = product.stockQty + quantity;
      if (newStockQty < 0) {
        throw new BadRequestException(
          `Adjustment would result in negative stock (current: ${product.stockQty}, adjustment: ${quantity})`,
        );
      }

      const updated = await tx.product.update({
        where: { id: productId },
        data: { stockQty: newStockQty },
        select: { stockQty: true },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          type: StockMovementType.MANUAL_ADJUST,
          notes: reason,
          createdBy: userId,
        },
      });

      this.logger.log(
        `Manual stock adjustment for product ${productId}: ${quantity > 0 ? '+' : ''}${quantity} by user ${userId}. Reason: ${reason}`,
      );

      return { newStockQty: updated.stockQty };
    });

    return result;
  }

  async setStock(
    productId: number,
    newStockQty: number,
    reason: string,
    userId: string,
  ): Promise<{ newStockQty: number }> {
    if (newStockQty < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, productName: true, stockQty: true },
      });

      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const diff = newStockQty - product.stockQty;

      await tx.product.update({
        where: { id: productId },
        data: { stockQty: newStockQty },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          quantity: diff,
          type: StockMovementType.STOCK_COUNT,
          notes: `Stock set to ${newStockQty} (was ${product.stockQty}). Reason: ${reason}`,
          createdBy: userId,
        },
      });

      this.logger.log(
        `Stock set for product ${productId}: ${product.stockQty} → ${newStockQty} by user ${userId}`,
      );

      return { newStockQty };
    });

    return result;
  }

  async getLowStockProducts(threshold?: number) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          // Products where available stock <= their lowStockAlert
          // We use raw filter since Prisma can't do computed column comparisons
        ],
      },
      select: {
        id: true,
        productName: true,
        sku: true,
        stockQty: true,
        reservedQty: true,
        lowStockAlert: true,
      },
      orderBy: { stockQty: 'asc' },
    });

    // Filter in application code since Prisma doesn't support computed column filters
    return products.filter(p => {
      const available = p.stockQty - p.reservedQty;
      const alertLevel = threshold ?? p.lowStockAlert;
      return available <= alertLevel;
    }).map(p => ({
      ...p,
      available: p.stockQty - p.reservedQty,
    }));
  }

  async getStockHistory(productId: number, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, productName: true, stockQty: true, reservedQty: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.stockMovement.count({ where: { productId } }),
    ]);

    return {
      product: {
        id: product.id,
        name: product.productName,
        stockQty: product.stockQty,
        reservedQty: product.reservedQty,
        available: product.stockQty - product.reservedQty,
      },
      movements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async recalculateReservedQuantities(): Promise<{ fixed: number; details: any[] }> {
    // Statuses that hold a stock reservation
    const reservingStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.PAYMENT_PENDING,
    ];

    // Sum quantities per product across all orders that are holding a reservation
    const pendingItems = await this.prisma.orderItem.findMany({
      where: {
        productId: { not: null },
        order: { status: { in: reservingStatuses } },
      },
      select: { productId: true, quantity: true },
    });

    const reservedMap = new Map<number, number>();
    for (const item of pendingItems) {
      if (item.productId != null) {
        reservedMap.set(item.productId, (reservedMap.get(item.productId) ?? 0) + item.quantity);
      }
    }

    // Collect all products that either currently have reservedQty > 0 or should have reservations
    const productsWithReserved = await this.prisma.product.findMany({
      where: { reservedQty: { gt: 0 } },
      select: { id: true, productName: true, reservedQty: true },
    });

    const allProductIds = new Set<number>([
      ...productsWithReserved.map(p => p.id),
      ...reservedMap.keys(),
    ]);

    const details: any[] = [];
    let fixed = 0;

    for (const productId of allProductIds) {
      const correctReserved = reservedMap.get(productId) ?? 0;
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, productName: true, sku: true, stockQty: true, reservedQty: true },
      });

      if (!product) continue;

      if (product.reservedQty === correctReserved) {
        details.push({
          productId,
          sku: product.sku,
          name: product.productName,
          reservedQty: product.reservedQty,
          available: product.stockQty - product.reservedQty,
          status: 'ok',
        });
      } else {
        await this.prisma.product.update({
          where: { id: productId },
          data: { reservedQty: correctReserved },
        });

        await this.prisma.stockMovement.create({
          data: {
            productId,
            quantity: correctReserved - product.reservedQty,
            type: StockMovementType.MANUAL_ADJUST,
            notes: `Recalculated reservedQty: ${product.reservedQty} → ${correctReserved} (stale reservation fix)`,
          },
        });

        details.push({
          productId,
          sku: product.sku,
          name: product.productName,
          oldReservedQty: product.reservedQty,
          newReservedQty: correctReserved,
          available: product.stockQty - correctReserved,
        });
        fixed++;
      }
    }

    this.logger.log(`recalculateReservedQuantities: fixed=${fixed}, checked=${allProductIds.size}`);
    return { fixed, details };
  }
}
