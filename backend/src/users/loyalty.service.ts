import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create loyalty wallet for a user
   */
  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.loyaltyWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.loyaltyWallet.create({
        data: { userId },
      });
    }

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
      totalEarnedAed: wallet.totalEarnedAed,
      totalRedeemedAed: wallet.totalRedeemedAed,
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
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
}
