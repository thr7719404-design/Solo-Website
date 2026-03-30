import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePaymentMethodDto {
  provider?: string;
  providerPaymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault?: boolean;
}

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all payment methods for a user
   */
  async getPaymentMethods(userId: string) {
    return this.prisma.savedPaymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        brand: true,
        last4: true,
        expMonth: true,
        expYear: true,
        isDefault: true,
        provider: true,
        createdAt: true,
      },
    });
  }

  /**
   * Add a new payment method
   * NOTE: Never store raw card numbers. Only store tokenized data from payment provider.
   */
  async addPaymentMethod(userId: string, dto: CreatePaymentMethodDto) {
    // Validate last4 is exactly 4 digits
    if (!/^\d{4}$/.test(dto.last4)) {
      throw new BadRequestException('last4 must be exactly 4 digits');
    }

    // Validate expiry
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    if (
      dto.expYear < currentYear ||
      (dto.expYear === currentYear && dto.expMonth < currentMonth)
    ) {
      throw new BadRequestException('Card has expired');
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.savedPaymentMethod.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the first payment method, make it default
    const existingCount = await this.prisma.savedPaymentMethod.count({
      where: { userId },
    });

    return this.prisma.savedPaymentMethod.create({
      data: {
        userId,
        provider: dto.provider || 'stripe',
        providerPaymentMethodId: dto.providerPaymentMethodId,
        brand: dto.brand.toLowerCase(),
        last4: dto.last4,
        expMonth: dto.expMonth,
        expYear: dto.expYear,
        isDefault: dto.isDefault || existingCount === 0,
      },
      select: {
        id: true,
        brand: true,
        last4: true,
        expMonth: true,
        expYear: true,
        isDefault: true,
        provider: true,
        createdAt: true,
      },
    });
  }

  /**
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
    // Verify ownership
    const paymentMethod = await this.prisma.savedPaymentMethod.findFirst({
      where: { id: paymentMethodId, userId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Unset other defaults
    await this.prisma.savedPaymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    return this.prisma.savedPaymentMethod.update({
      where: { id: paymentMethodId },
      data: { isDefault: true },
      select: {
        id: true,
        brand: true,
        last4: true,
        expMonth: true,
        expYear: true,
        isDefault: true,
        provider: true,
      },
    });
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(userId: string, paymentMethodId: string) {
    const paymentMethod = await this.prisma.savedPaymentMethod.findFirst({
      where: { id: paymentMethodId, userId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    await this.prisma.savedPaymentMethod.delete({
      where: { id: paymentMethodId },
    });

    // If deleted was default, set another as default
    if (paymentMethod.isDefault) {
      const remaining = await this.prisma.savedPaymentMethod.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (remaining) {
        await this.prisma.savedPaymentMethod.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Payment method deleted successfully' };
  }
}
