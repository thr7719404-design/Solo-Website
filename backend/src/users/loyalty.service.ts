import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create loyalty wallet for a user
   */
  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.loyaltyWallet.findUnique({
      where: { userId },
    });

    wallet ??= await this.prisma.loyaltyWallet.create({
      data: { userId },
    });

    return wallet;
  }

  /**
   * Get loyalty data including balance and transactions
   */
  async getLoyalty(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      balanceAed: wallet.balanceAed,
      pendingBalanceAed: (wallet as any).pendingBalanceAed ?? new Decimal(0),
      totalEarnedAed: wallet.totalEarnedAed,
      totalRedeemedAed: wallet.totalRedeemedAed,
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        status: (t as any).status ?? 'CONFIRMED',
        amountAed: t.amountAed,
        description: t.description,
        orderId: t.orderId,
        createdAt: t.createdAt,
      })),
    };
  }

  /**
   * Add loyalty cash (earned from order)
   */
  async addLoyaltyCash(
    userId: string,
    amountAed: number,
    orderId?: string,
    description?: string,
  ) {
    const wallet = await this.getOrCreateWallet(userId);

    const [updatedWallet] = await this.prisma.$transaction([
      this.prisma.loyaltyWallet.update({
        where: { id: wallet.id },
        data: {
          balanceAed: { increment: amountAed },
          totalEarnedAed: { increment: amountAed },
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'EARNED',
          amountAed: new Decimal(amountAed),
          description: description || `Earned from order`,
          orderId,
        },
      }),
    ]);

    return updatedWallet;
  }

  /**
   * Redeem loyalty cash on an order
   */
  async redeemLoyaltyCash(
    userId: string,
    amountAed: number,
    orderId?: string,
    description?: string,
  ) {
    const wallet = await this.getOrCreateWallet(userId);

    if (Number(wallet.balanceAed) < amountAed) {
      throw new Error('Insufficient loyalty balance');
    }

    const [updatedWallet] = await this.prisma.$transaction([
      this.prisma.loyaltyWallet.update({
        where: { id: wallet.id },
        data: {
          balanceAed: { decrement: amountAed },
          totalRedeemedAed: { increment: amountAed },
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'REDEEMED',
          amountAed: new Decimal(-amountAed),
          description: description || `Redeemed on order`,
          orderId,
        },
      }),
    ]);

    return updatedWallet;
  }

  /**
   * Admin adjustment of loyalty balance (can be positive or negative)
   */
  async adjustLoyalty(
    userId: string,
    amountAed: number,
    description?: string,
  ) {
    const wallet = await this.getOrCreateWallet(userId);

    // For negative adjustments, check balance
    if (amountAed < 0 && Number(wallet.balanceAed) < Math.abs(amountAed)) {
      throw new Error(`Insufficient balance for adjustment. Current balance: AED ${wallet.balanceAed}`);
    }

    const [updatedWallet] = await this.prisma.$transaction([
      this.prisma.loyaltyWallet.update({
        where: { id: wallet.id },
        data: {
          balanceAed: { increment: amountAed },
          // Track in totalEarnedAed if positive, totalRedeemedAed if negative
          ...(amountAed > 0
            ? { totalEarnedAed: { increment: amountAed } }
            : { totalRedeemedAed: { increment: Math.abs(amountAed) } }),
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'ADJUSTMENT',
          amountAed: new Decimal(amountAed),
          description: description || `Admin adjustment`,
        },
      }),
    ]);

    return {
      balanceAed: updatedWallet.balanceAed,
      totalEarnedAed: updatedWallet.totalEarnedAed,
      totalRedeemedAed: updatedWallet.totalRedeemedAed,
    };
  }

  // ===========================================================================
  // PENDING / CONFIRMED / REVERSED lifecycle
  // ---------------------------------------------------------------------------
  // Credit earned on an order is initially PENDING (not redeemable). When the
  // order reaches DELIVERED it is CONFIRMED -> moves to balanceAed. If the
  // order is CANCELLED/REFUNDED before delivery, the pending credit is
  // REVERSED. Returns after delivery use the existing reverseLoyaltyEarned
  // path which deducts from balanceAed (already covered in returns.service).
  // All methods are idempotent and safe to call on missing/duplicate inputs.
  // ===========================================================================

  /**
   * Add a PENDING earn for an order. Increments pendingBalanceAed only.
   * Does NOT touch balanceAed or totalEarnedAed (those happen at confirm).
   * Idempotent: if a PENDING/CONFIRMED EARNED txn already exists for this
   * orderId, this call is a no-op.
   */
  async addPendingLoyaltyCash(
    userId: string,
    amountAed: number,
    orderId: string,
    description?: string,
  ): Promise<void> {
    if (!orderId || amountAed <= 0) return;

    const wallet = await this.getOrCreateWallet(userId);

    const existing = await this.prisma.loyaltyTransaction.findFirst({
      where: {
        walletId: wallet.id,
        orderId,
        type: 'EARNED',
        status: { in: ['PENDING', 'CONFIRMED'] } as any,
      },
      select: { id: true, status: true },
    });
    if (existing) {
      this.logger.log(
        `Pending earn skipped — order ${orderId} already has ${existing.status} EARNED txn ${existing.id}`,
      );
      return;
    }

    await this.prisma.$transaction([
      this.prisma.loyaltyWallet.update({
        where: { id: wallet.id },
        data: { pendingBalanceAed: { increment: amountAed } } as any,
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'EARNED',
          status: 'PENDING' as any,
          amountAed: new Decimal(amountAed),
          description: description || `Pending — earned from order`,
          orderId,
        } as any,
      }),
    ]);

    this.logger.log(
      `Pending loyalty credited: user=${userId} order=${orderId} amount=${amountAed}`,
    );
  }

  /**
   * Confirm a PENDING earn for an order. Moves the amount from
   * pendingBalanceAed -> balanceAed + totalEarnedAed and marks the txn
   * CONFIRMED. Idempotent: if no PENDING txn exists (already confirmed,
   * never created, etc.) this is a no-op.
   */
  async confirmPendingLoyaltyCash(orderId: string): Promise<void> {
    if (!orderId) return;

    const pending = await this.prisma.loyaltyTransaction.findFirst({
      where: {
        orderId,
        type: 'EARNED',
        status: 'PENDING' as any,
      },
      select: { id: true, walletId: true, amountAed: true },
    });
    if (!pending) {
      this.logger.log(`Confirm-loyalty no-op for order ${orderId} (no PENDING earn)`);
      return;
    }

    const amount = Number(pending.amountAed);

    await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.update({
        where: { id: pending.id },
        data: { status: 'CONFIRMED' as any } as any,
      }),
      this.prisma.loyaltyWallet.update({
        where: { id: pending.walletId },
        data: {
          pendingBalanceAed: { decrement: amount } as any,
          balanceAed: { increment: amount },
          totalEarnedAed: { increment: amount },
        } as any,
      }),
    ]);

    this.logger.log(
      `Loyalty confirmed: order=${orderId} amount=${amount} (pending -> balance)`,
    );
  }

  /**
   * Reverse a PENDING earn for an order (e.g. order cancelled before
   * delivery). Marks the txn REVERSED and decrements pendingBalanceAed.
   * Idempotent: if no PENDING txn exists (already confirmed/reversed/never
   * created) this is a no-op. Does NOT touch balanceAed — post-delivery
   * reversal is handled by returns.service.reverseLoyaltyEarned.
   */
  async reversePendingLoyaltyCash(orderId: string, reason?: string): Promise<void> {
    if (!orderId) return;

    const pending = await this.prisma.loyaltyTransaction.findFirst({
      where: {
        orderId,
        type: 'EARNED',
        status: 'PENDING' as any,
      },
      select: { id: true, walletId: true, amountAed: true },
    });
    if (!pending) {
      this.logger.log(
        `Reverse-pending-loyalty no-op for order ${orderId} (no PENDING earn)`,
      );
      return;
    }

    const amount = Number(pending.amountAed);

    await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.update({
        where: { id: pending.id },
        data: {
          status: 'REVERSED' as any,
          description: reason ? `Reversed — ${reason}` : 'Reversed',
        } as any,
      }),
      this.prisma.loyaltyWallet.update({
        where: { id: pending.walletId },
        data: { pendingBalanceAed: { decrement: amount } as any } as any,
      }),
    ]);

    this.logger.log(
      `Loyalty pending reversed: order=${orderId} amount=${amount} reason=${reason ?? 'n/a'}`,
    );
  }
}
