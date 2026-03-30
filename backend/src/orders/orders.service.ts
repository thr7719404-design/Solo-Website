import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyService } from '../users/loyalty.service';
import { StripeService } from '../stripe/stripe.service';
import { SettingsService } from '../settings/settings.service';
import { StockService } from '../stock/stock.service';
import { CreateOrderDto, PaymentMethodDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus, ShippingMethod, PaymentMethod, CartItemType } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
    private readonly stripeService: StripeService,
    private readonly settingsService: SettingsService,
    private readonly stockService: StockService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { shippingAddressId, shippingAddress, billingAddressId, billingAddress, shippingMethod, paymentMethod, items, promoCode, notes } = createOrderDto;

    // Validate: either shippingAddressId or shippingAddress must be provided
    if (!shippingAddressId && !shippingAddress) {
      throw new BadRequestException('Either shippingAddressId or shippingAddress must be provided');
    }

    // Validate items
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // If shippingAddressId is provided, validate it belongs to the user
    let existingAddress = null;
    if (shippingAddressId) {
      existingAddress = await this.prisma.address.findFirst({
        where: { id: shippingAddressId, userId },
      });
      if (!existingAddress) {
        throw new BadRequestException('Shipping address not found or does not belong to user');
      }
    }

    // If billingAddressId is provided, validate it belongs to the user
    let existingBillingAddress = null;
    if (billingAddressId) {
      existingBillingAddress = await this.prisma.address.findFirst({
        where: { id: billingAddressId, userId },
      });
      if (!existingBillingAddress) {
        throw new BadRequestException('Billing address not found or does not belong to user');
      }
    }

    // Fetch products with pricing to get current prices
    const productIds = items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        pricing: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Check stock availability for all items
    const stockCheck = await this.stockService.checkBulkAvailability(
      items.map(item => ({ productId: item.productId, quantity: item.quantity })),
    );
    if (!stockCheck.allAvailable) {
      const errorMsg = stockCheck.unavailable
        .map(u => `${u.name}: requested ${u.requested}, available ${u.available}`)
        .join('; ');
      throw new BadRequestException(`Insufficient stock: ${errorMsg}`);
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }
      
      // Get price from pricing relation
      const price = product.pricing?.price_incl_vat_aed 
        ? Number(product.pricing.price_incl_vat_aed) 
        : (product.pricing?.price_excl_vat_aed ? Number(product.pricing.price_excl_vat_aed) : 0);
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      return {
        type: CartItemType.PRODUCT,
        productId: product.id,
        name: product.productName,
        sku: product.sku,
        quantity: item.quantity,
        price: price,
        subtotal: itemSubtotal,
      };
    });

    // Calculate shipping cost (free if promo code is FREE_SHIPPING)
    let shippingCost = this.calculateShippingCost(shippingMethod as unknown as ShippingMethod);
    
    // Calculate VAT from settings
    const vatRate = await this.settingsService.getVatRate();
    const vat = subtotal * vatRate;
    
    // Calculate discount if promo code
    let discount = 0;
    let promoDiscountType: string | null = null;
    let promoDiscountValue: number | null = null;
    let promoCodeId: string | null = null;
    
    if (promoCode) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: promoCode },
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
      if (promo.minOrderAmount && subtotal < Number(promo.minOrderAmount)) {
        throw new BadRequestException(`Minimum order amount of AED ${Number(promo.minOrderAmount).toFixed(2)} required for this promo code`);
      }

      promoCodeId = promo.id;

      switch (promo.type) {
        case 'PERCENTAGE':
          discount = subtotal * (Number(promo.value) / 100);
          if (promo.maxDiscount && discount > Number(promo.maxDiscount)) {
            discount = Number(promo.maxDiscount);
          }
          promoDiscountType = 'PERCENTAGE';
          promoDiscountValue = Number(promo.value);
          break;
        case 'FIXED_AMOUNT':
          discount = Math.min(Number(promo.value), subtotal);
          promoDiscountType = 'FIXED_AMOUNT';
          promoDiscountValue = Number(promo.value);
          break;
        case 'FREE_SHIPPING':
          discount = shippingCost; // Discount equals shipping cost
          shippingCost = 0;
          promoDiscountType = 'FREE_SHIPPING';
          promoDiscountValue = 0;
          break;
      }
    }
    
    // Validate and process loyalty cash redemption
    let loyaltyRedeemAed = 0;
    if (createOrderDto.loyaltyRedeemAed && createOrderDto.loyaltyRedeemAed > 0) {
      // Get user's current loyalty balance
      const loyaltyData = await this.loyaltyService.getLoyalty(userId);
      const balanceAed = Number(loyaltyData.balanceAed);
      
      // Validate redemption amount doesn't exceed balance
      if (createOrderDto.loyaltyRedeemAed > balanceAed) {
        throw new BadRequestException(`Insufficient loyalty balance. Available: AED ${balanceAed.toFixed(2)}`);
      }
      
      // Enforce 30% cap rule: can only redeem up to 30% of subtotal
      const maxRedeemable = subtotal * 0.30;
      if (createOrderDto.loyaltyRedeemAed > maxRedeemable) {
        throw new BadRequestException(`Loyalty redemption cannot exceed 30% of subtotal (max: AED ${maxRedeemable.toFixed(2)})`);
      }
      
      loyaltyRedeemAed = createOrderDto.loyaltyRedeemAed;
    }
    
    // Calculate total (apply loyalty redemption as discount)
    const total = subtotal + shippingCost + vat - discount - loyaltyRedeemAed;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Determine initial payment status based on payment method
    let initialPaymentStatus: PaymentStatus = PaymentStatus.PENDING;
    let initialOrderStatus: OrderStatus = OrderStatus.PAYMENT_PENDING;
    let paymentIntentId: string | null = null;
    
    if (paymentMethod === PaymentMethodDto.CASH_ON_DELIVERY) {
      initialPaymentStatus = PaymentStatus.PENDING;
      initialOrderStatus = OrderStatus.PROCESSING;
    } else if (paymentMethod === PaymentMethodDto.CREDIT_CARD) {
      // Verify Stripe payment
      if (!createOrderDto.paymentIntentId) {
        throw new BadRequestException('Payment intent ID is required for credit card payments');
      }
      
      try {
        const pi = await this.stripeService.verifyPaymentIntent(createOrderDto.paymentIntentId);
        if (pi.status === 'succeeded') {
          initialPaymentStatus = PaymentStatus.PAID;
          initialOrderStatus = OrderStatus.PROCESSING;
          paymentIntentId = pi.id;
        } else if (pi.status === 'requires_capture') {
          initialPaymentStatus = PaymentStatus.PENDING;
          initialOrderStatus = OrderStatus.PAYMENT_PENDING;
          paymentIntentId = pi.id;
        } else {
          throw new BadRequestException(`Payment not completed. Status: ${pi.status}`);
        }
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
        throw new BadRequestException('Failed to verify payment. Please try again.');
      }
    }

    // Create the order in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      let orderShippingAddressId: string;
      let orderBillingAddressId: string;

      if (existingAddress) {
        // Use existing saved address - create a copy for the order to preserve address at time of order
        const shippingAddrCopy = await tx.address.create({
          data: {
            userId,
            firstName: existingAddress.firstName,
            lastName: existingAddress.lastName,
            addressLine1: existingAddress.addressLine1,
            addressLine2: existingAddress.addressLine2,
            city: existingAddress.city,
            postalCode: existingAddress.postalCode,
            phone: existingAddress.phone || '',
            label: existingAddress.label,
          },
        });
        orderShippingAddressId = shippingAddrCopy.id;
        // Default billing to shipping
        orderBillingAddressId = shippingAddrCopy.id;

        // If billingAddressId provided, lookup and create copy
        if (existingBillingAddress) {
          const billingAddrCopy = await tx.address.create({
            data: {
              userId,
              firstName: existingBillingAddress.firstName,
              lastName: existingBillingAddress.lastName,
              addressLine1: existingBillingAddress.addressLine1,
              addressLine2: existingBillingAddress.addressLine2,
              city: existingBillingAddress.city,
              postalCode: existingBillingAddress.postalCode,
              phone: existingBillingAddress.phone || '',
              label: existingBillingAddress.label,
            },
          });
          orderBillingAddressId = billingAddrCopy.id;
        } else if (billingAddress) {
          // If billingAddress provided inline, create it
          const billingAddr = await tx.address.create({
            data: {
              userId,
              firstName: billingAddress.firstName,
              lastName: billingAddress.lastName,
              addressLine1: billingAddress.street,
              addressLine2: billingAddress.apartment,
              city: billingAddress.city,
              postalCode: billingAddress.postalCode,
              phone: billingAddress.phone || '',
            },
          });
          orderBillingAddressId = billingAddr.id;
        }
      } else {
        // Create new shipping address from provided data
        // shippingAddress must exist here since we validated earlier
        if (!shippingAddress) {
          throw new BadRequestException('Shipping address data is required');
        }
        const shippingAddr = await tx.address.create({
          data: {
            userId,
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            addressLine1: shippingAddress.street,
            addressLine2: shippingAddress.apartment,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            phone: shippingAddress.phone || '',
          },
        });
        orderShippingAddressId = shippingAddr.id;

        // Create billing address
        // Priority: billingAddressId > billingAddress inline > same as shipping
        if (existingBillingAddress) {
          const billingAddrCopy = await tx.address.create({
            data: {
              userId,
              firstName: existingBillingAddress.firstName,
              lastName: existingBillingAddress.lastName,
              addressLine1: existingBillingAddress.addressLine1,
              addressLine2: existingBillingAddress.addressLine2,
              city: existingBillingAddress.city,
              postalCode: existingBillingAddress.postalCode,
              phone: existingBillingAddress.phone || '',
              label: existingBillingAddress.label,
            },
          });
          orderBillingAddressId = billingAddrCopy.id;
        } else {
          const billingData = billingAddress || shippingAddress;
          if (!billingData) {
            throw new BadRequestException('Billing address data is required');
          }
          const billingAddr = await tx.address.create({
            data: {
              userId,
              firstName: billingData.firstName,
              lastName: billingData.lastName,
              addressLine1: billingData.street,
              addressLine2: billingData.apartment,
              city: billingData.city,
              postalCode: billingData.postalCode,
              phone: billingData.phone || '',
            },
          });
          orderBillingAddressId = billingAddr.id;
        }
      }

      // Prepare billing invoice fields (trim to 60 chars max)
      const billingInvoiceCompany = createOrderDto.billingInvoiceCompany?.trim().substring(0, 60) || null;
      const billingInvoiceVatNumber = createOrderDto.billingInvoiceVatNumber?.trim().substring(0, 60) || null;

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: initialOrderStatus,
          paymentStatus: initialPaymentStatus,
          shippingAddressId: orderShippingAddressId,
          billingAddressId: orderBillingAddressId,
          shippingMethod: shippingMethod as unknown as ShippingMethod,
          shippingCost,
          subtotal,
          discount,
          vat,
          total,
          promoCode,
          promoDiscountType,
          promoDiscountValue,
          paymentIntentId,
          loyaltyRedeemAed: loyaltyRedeemAed > 0 ? loyaltyRedeemAed : null,
          paymentMethod: paymentMethod as unknown as PaymentMethod,
          notes,
          billingInvoiceCompany,
          billingInvoiceVatNumber,
          items: {
            create: orderItems,
          },
          statusHistory: {
            create: {
              status: initialOrderStatus,
              notes: paymentMethod === PaymentMethodDto.CASH_ON_DELIVERY 
                ? 'Order placed with Cash on Delivery' 
                : 'Order placed, awaiting payment',
            },
          },
        },
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Reserve stock for all order items
      await this.stockService.reserveStockBatch(
        orderItems
          .filter(item => item.productId != null)
          .map(item => ({ productId: item.productId, quantity: item.quantity })),
        newOrder.id,
        userId,
      );

      return newOrder;
    });

    // Process loyalty cash redemption outside transaction (after order created successfully)
    if (loyaltyRedeemAed > 0) {
      await this.loyaltyService.redeemLoyaltyCash(
        userId,
        loyaltyRedeemAed,
        order.id,
        `Redeemed on order ${order.orderNumber}`,
      );
    }

    // Increment promo code usage count
    if (promoCodeId) {
      await this.prisma.promoCode.update({
        where: { id: promoCodeId },
        data: { usageCount: { increment: 1 } },
      });
    }

    // Compute and award loyalty cash earned from this order
    const earnPercent = await this.getLoyaltyEarnPercent();
    // Eligible amount = subtotal minus any loyalty redeemed
    const eligibleForEarn = Math.max(0, subtotal - loyaltyRedeemAed);
    const loyaltyEarnAed = Math.round(eligibleForEarn * earnPercent * 100) / 100;

    if (loyaltyEarnAed > 0) {
      // Update the order with earned amount
      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: { loyaltyEarnAed },
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Create EARNED transaction and update wallet
      await this.loyaltyService.addLoyaltyCash(
        userId,
        loyaltyEarnAed,
        order.id,
        `Earned from Order #${order.orderNumber}`,
      );

      return this.formatOrderResponse(updatedOrder);
    }

    return this.formatOrderResponse(order);
  }

  /**
   * Update order status with stock lifecycle management.
   * Handles confirm/release/restore based on transition.
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId?: string,
    notes?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const oldStatus = order.status;
    const stockItems = order.items
      .filter((item): item is typeof item & { productId: number } => item.productId != null)
      .map(item => ({ productId: item.productId, quantity: item.quantity }));

    // Handle stock lifecycle based on status transition
    if (newStatus === OrderStatus.PROCESSING && oldStatus === OrderStatus.PAYMENT_PENDING) {
      // Payment confirmed → confirm reservation (deduct from stockQty and reservedQty)
      if (stockItems.length > 0) {
        await this.stockService.confirmReservationBatch(stockItems, orderId, userId);
        this.logger.log(`Confirmed stock reservation for order ${orderId}`);
      }
    } else if (newStatus === OrderStatus.CANCELLED) {
      if (
        oldStatus === OrderStatus.PENDING ||
        oldStatus === OrderStatus.PAYMENT_PENDING
      ) {
        // Cancelled before payment confirmed → release reservation
        if (stockItems.length > 0) {
          await this.stockService.releaseReservationBatch(stockItems, orderId, userId);
          this.logger.log(`Released stock reservation for cancelled order ${orderId}`);
        }
      } else if (
        oldStatus === OrderStatus.PROCESSING ||
        oldStatus === OrderStatus.PAID ||
        oldStatus === OrderStatus.SHIPPED
      ) {
        // Cancelled after payment confirmed → restore stock
        if (stockItems.length > 0) {
          await this.stockService.restoreStockBatch(stockItems, orderId, userId);
          this.logger.log(`Restored stock for cancelled order ${orderId}`);
        }
      }
    } else if (newStatus === OrderStatus.REFUNDED) {
      // Refund → restore stock
      if (stockItems.length > 0) {
        await this.stockService.restoreStockBatch(stockItems, orderId, userId);
        this.logger.log(`Restored stock for refunded order ${orderId}`);
      }
    }

    // Update order status and optional payment fields
    const updateData: any = {
      status: newStatus,
      statusHistory: {
        create: {
          status: newStatus,
          notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
        },
      },
    };

    if (newStatus === OrderStatus.PROCESSING && order.paymentStatus === PaymentStatus.PENDING) {
      updateData.paymentStatus = PaymentStatus.PAID;
      updateData.paidAt = new Date();
    }
    if (newStatus === OrderStatus.REFUNDED) {
      updateData.paymentStatus = PaymentStatus.REFUNDED;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    return this.formatOrderResponse(updatedOrder);
  }

  /**
   * Get loyalty earn percent from SiteSetting (DB-driven)
   * Default: 0.05 (5%)
   */
  private async getLoyaltyEarnPercent(): Promise<number> {
    const key = 'loyalty_earn_percent';
    let setting = await this.prisma.siteSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      // Auto-create with default value
      setting = await this.prisma.siteSetting.create({
        data: {
          key,
          value: '0.05',
          type: 'number',
          group: 'loyalty',
          label: 'Loyalty Earn Percent (e.g., 0.05 = 5%)',
        },
      });
    }

    const parsed = Number.parseFloat(setting.value);
    return Number.isNaN(parsed) ? 0.05 : parsed;
  }

  async getOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(order => this.formatOrderResponse(order));
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrderResponse(order);
  }

  async getAllOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        include: {
          items: true,
          shippingAddress: true,
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count(),
    ]);

    return {
      data: orders.map(order => this.formatOrderResponse(order)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private calculateShippingCost(method: ShippingMethod): number {
    switch (method) {
      case ShippingMethod.EXPRESS:
        return 25;
      case ShippingMethod.OVERNIGHT:
        return 50;
      case ShippingMethod.PICKUP:
        return 0;
      case ShippingMethod.STANDARD:
      default:
        return 10;
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Get the count of orders this month
    const count = await this.prisma.order.count({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
    });

    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }

  private formatOrderResponse(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      vat: Number(order.vat),
      discount: Number(order.discount),
      loyaltyRedeemAed: order.loyaltyRedeemAed ? Number(order.loyaltyRedeemAed) : 0,
      loyaltyEarnAed: order.loyaltyEarnAed ? Number(order.loyaltyEarnAed) : 0,
      total: Number(order.total),
      promoCode: order.promoCode,
      notes: order.notes,
      trackingNumber: order.trackingNumber,
      billingInvoiceCompany: order.billingInvoiceCompany,
      billingInvoiceVatNumber: order.billingInvoiceVatNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      items: order.items?.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      user: order.user,
      statusHistory: order.statusHistory,
    };
  }
}
