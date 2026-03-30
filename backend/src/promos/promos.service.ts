import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/promo-code.dto';
import { PromoType } from '@prisma/client';

@Injectable()
export class PromosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get all promo codes (admin) */
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.promoCode.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promoCode.count(),
    ]);

    return {
      data: data.map(p => this.formatPromo(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Get single promo code by ID */
  async findOne(id: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');
    return this.formatPromo(promo);
  }

  /** Create a new promo code */
  async create(dto: CreatePromoCodeDto) {
    // Check for duplicate code
    const existing = await this.prisma.promoCode.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException(`Promo code "${dto.code}" already exists`);
    }

    const promo = await this.prisma.promoCode.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        type: dto.type as PromoType,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount,
        maxDiscount: dto.maxDiscount,
        usageLimit: dto.usageLimit,
        isActive: dto.isActive ?? true,
        startsAt: new Date(dto.startsAt),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return this.formatPromo(promo);
  }

  /** Update an existing promo code */
  async update(id: string, dto: UpdatePromoCodeDto) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promo code not found');

    const data: any = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type as PromoType;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.minOrderAmount !== undefined) data.minOrderAmount = dto.minOrderAmount;
    if (dto.maxDiscount !== undefined) data.maxDiscount = dto.maxDiscount;
    if (dto.usageLimit !== undefined) data.usageLimit = dto.usageLimit;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.expiresAt !== undefined) data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const promo = await this.prisma.promoCode.update({
      where: { id },
      data,
    });

    return this.formatPromo(promo);
  }

  /** Delete a promo code */
  async remove(id: string) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promo code not found');

    await this.prisma.promoCode.delete({ where: { id } });
    return { message: 'Promo code deleted successfully' };
  }

  /** Validate a promo code (public endpoint for storefront) */
  async validate(code: string, orderAmount: number) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      throw new BadRequestException('Invalid promo code');
    }
    if (!promo.isActive) {
      throw new BadRequestException('This promo code is no longer active');
    }
    if (promo.startsAt && new Date() < promo.startsAt) {
      throw new BadRequestException('This promo code is not yet valid');
    }
    if (promo.expiresAt && new Date() > promo.expiresAt) {
      throw new BadRequestException('This promo code has expired');
    }
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      throw new BadRequestException('This promo code has reached its usage limit');
    }
    if (promo.minOrderAmount && orderAmount < Number(promo.minOrderAmount)) {
      throw new BadRequestException(
        `Minimum order amount of AED ${Number(promo.minOrderAmount).toFixed(2)} required`,
      );
    }

    // Calculate discount
    let discountAmount = 0;
    switch (promo.type) {
      case 'PERCENTAGE':
        discountAmount = orderAmount * (Number(promo.value) / 100);
        if (promo.maxDiscount && discountAmount > Number(promo.maxDiscount)) {
          discountAmount = Number(promo.maxDiscount);
        }
        break;
      case 'FIXED_AMOUNT':
        discountAmount = Math.min(Number(promo.value), orderAmount);
        break;
      case 'FREE_SHIPPING':
        discountAmount = 0; // Applied at shipping
        break;
    }

    return {
      valid: true,
      code: promo.code,
      type: promo.type,
      value: Number(promo.value),
      discountAmount: Math.round(discountAmount * 100) / 100,
      description: promo.description,
    };
  }

  /** Get orders that used a specific promo code (admin tracking) */
  async getPromoCodeOrders(promoCodeId: string, page = 1, limit = 20) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id: promoCodeId } });
    if (!promo) throw new NotFoundException('Promo code not found');

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { promoCode: promo.code },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          items: {
            select: {
              id: true,
              name: true,
              sku: true,
              quantity: true,
              price: true,
              subtotal: true,
              productId: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where: { promoCode: promo.code } }),
    ]);

    return {
      promoCode: this.formatPromo(promo),
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.user,
        total: Number(o.total),
        discount: Number(o.discount),
        promoDiscountType: o.promoDiscountType,
        promoDiscountValue: o.promoDiscountValue ? Number(o.promoDiscountValue) : null,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        items: o.items.map(i => ({
          id: i.id,
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          price: Number(i.price),
          subtotal: Number(i.subtotal),
          productId: i.productId,
        })),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private formatPromo(promo: any) {
    return {
      id: promo.id,
      code: promo.code,
      description: promo.description,
      type: promo.type,
      value: Number(promo.value),
      minOrderAmount: promo.minOrderAmount ? Number(promo.minOrderAmount) : null,
      maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : null,
      usageLimit: promo.usageLimit,
      usageCount: promo.usageCount,
      isActive: promo.isActive,
      startsAt: promo.startsAt,
      expiresAt: promo.expiresAt,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
    };
  }
}
