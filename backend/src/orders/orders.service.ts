import { Injectable, BadRequestException, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyService } from '../users/loyalty.service';
import { StripeService } from '../stripe/stripe.service';
import { SettingsService } from '../settings/settings.service';
import { StockService } from '../stock/stock.service';
import { EmailService } from '../email/email.service';
import { InvoiceService } from './invoice.service';
import { CreateOrderDto, PaymentMethodDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus, ShippingMethod, PaymentMethod, CartItemType } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
    private readonly stockService: StockService,
    private readonly emailService: EmailService,
    private readonly invoiceService: InvoiceService,
  ) {}

  /**
   * Generate an invoice and email the PDF to the customer (fire-and-forget).
   * Failures are logged but do not block the order creation flow.
   */
  private async issueInvoiceAndEmail(orderId: string): Promise<void> {
    try {
      // Persist invoice record (and upload PDF to storage if configured)
      await this.invoiceService.persistInvoice(orderId);

      // Generate PDF buffer for email attachment
      const { buffer } = await this.invoiceService.generateInvoicePdf(orderId, undefined, true);

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      });
      if (!order?.user?.email) return;

      const invoice = await this.prisma.invoices.findUnique({
        where: { orderId },
        select: { invoiceNumber: true },
      });
      const invoiceNumber = invoice?.invoiceNumber || `INV-${order.orderNumber}`;
      const customerName = `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Customer';

      await this.emailService.sendOrderInvoiceEmail({
        to: order.user.email,
        customerName,
        orderNumber: order.orderNumber,
        invoiceNumber,
        total: Number(order.total || 0),
        currency: 'AED',
        pdfBuffer: buffer,
      });
    } catch (err) {
      this.logger.error(`Failed to issue/email invoice for order ${orderId}: ${(err as Error).message}`);
    }
  }

  private async resolveSavedAddresses(
    userId: string,
    shippingAddressId?: string,
    billingAddressId?: string,
  ): Promise<{ existingAddress: any; existingBillingAddress: any }> {
    let existingAddress = null;
    if (shippingAddressId) {
      existingAddress = await this.prisma.address.findFirst({
        where: { id: shippingAddressId, userId },
      });
      if (!existingAddress) {
        throw new BadRequestException('Shipping address not found or does not belong to user');
      }
    }
    let existingBillingAddress = null;
    if (billingAddressId) {
      existingBillingAddress = await this.prisma.address.findFirst({
        where: { id: billingAddressId, userId },
      });
      if (!existingBillingAddress) {
        throw new BadRequestException('Billing address not found or does not belong to user');
      }
    }
    return { existingAddress, existingBillingAddress };
  }

  private async loadOrderProducts(items: Array<{ productId: number; quantity: number }>) {
    const productIds = items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { pricing: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }
    return products;
  }

  private async checkOrderStock(items: Array<{ productId: number; quantity: number }>): Promise<void> {
    const stockCheck = await this.stockService.checkBulkAvailability(
      items.map(item => ({ productId: item.productId, quantity: item.quantity })),
    );
    if (!stockCheck.allAvailable) {
      const errorMsg = stockCheck.unavailable
        .map(u => `${u.name}: requested ${u.requested}, available ${u.available}`)
        .join('; ');
      throw new BadRequestException(`Insufficient stock: ${errorMsg}`);
    }
  }

  private buildOrderItemsAndTotals(
    items: Array<{ productId: number; quantity: number }>,
    products: any[],
    vatRate: number,
  ): { orderItems: any[]; subtotalExclVat: number; totalVatAmount: number } {
    let subtotalExclVat = 0;
    let totalVatAmount = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }
      // Authoritative price is the VAT-inclusive price shown on the storefront.
      // Derive excl-VAT from incl-VAT to avoid stale price_excl_vat_aed values
      // that can be out of sync (e.g. from compareAtPrice mis-mapping).
      const unitPriceInclVat = product.pricing?.price_incl_vat_aed
        ? Number(product.pricing.price_incl_vat_aed)
        : 0;
      const unitPriceExclVat = Math.round((unitPriceInclVat / (1 + vatRate)) * 100) / 100;
      const unitVatAmount = Math.round((unitPriceInclVat - unitPriceExclVat) * 100) / 100;
      const lineSubtotalExclVat = Math.round(unitPriceExclVat * item.quantity * 100) / 100;
      const lineVatAmount = Math.round(unitVatAmount * item.quantity * 100) / 100;
      const lineTotalInclVat = Math.round(unitPriceInclVat * item.quantity * 100) / 100;
      subtotalExclVat += lineSubtotalExclVat;
      totalVatAmount += lineVatAmount;
      return {
        type: CartItemType.PRODUCT,
        productId: product.id,
        name: product.productName,
        sku: product.sku,
        quantity: item.quantity,
        price: unitPriceExclVat,
        subtotal: lineTotalInclVat,
        unitPriceExclVat,
        unitPriceInclVat,
        unitVatAmount,
        lineSubtotalExclVat,
        lineTotalInclVat,
        lineVatAmount,
        vatRateSnapshot: vatRate,
      };
    });
    return {
      orderItems,
      subtotalExclVat: Math.round(subtotalExclVat * 100) / 100,
      totalVatAmount: Math.round(totalVatAmount * 100) / 100,
    };
  }

  private validatePromoEligibility(promo: any, subtotal: number): void {
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
      throw new BadRequestException(
        `Minimum order amount of AED ${Number(promo.minOrderAmount).toFixed(2)} required for this promo code`,
      );
    }
  }

  private computePromoDiscount(promo: any, subtotal: number, shippingCost: number): {
    discount: number;
    promoDiscountType: string | null;
    promoDiscountValue: number | null;
    newShippingCost: number;
  } {
    if (promo.type === 'PERCENTAGE') {
      let discount = subtotal * (Number(promo.value) / 100);
      if (promo.maxDiscount && discount > Number(promo.maxDiscount)) {
        discount = Number(promo.maxDiscount);
      }
      return { discount, promoDiscountType: 'PERCENTAGE', promoDiscountValue: Number(promo.value), newShippingCost: shippingCost };
    }
    if (promo.type === 'FIXED_AMOUNT') {
      return {
        discount: Math.min(Number(promo.value), subtotal),
        promoDiscountType: 'FIXED_AMOUNT',
        promoDiscountValue: Number(promo.value),
        newShippingCost: shippingCost,
      };
    }
    if (promo.type === 'FREE_SHIPPING') {
      return { discount: shippingCost, promoDiscountType: 'FREE_SHIPPING', promoDiscountValue: 0, newShippingCost: 0 };
    }
    return { discount: 0, promoDiscountType: null, promoDiscountValue: null, newShippingCost: shippingCost };
  }

  private async resolvePromoCode(promoCode: string | undefined, subtotal: number, shippingCost: number): Promise<{
    discount: number;
    promoDiscountType: string | null;
    promoDiscountValue: number | null;
    promoCodeId: string | null;
    shippingCost: number;
  }> {
    if (!promoCode) {
      return { discount: 0, promoDiscountType: null, promoDiscountValue: null, promoCodeId: null, shippingCost };
    }
    const promo = await this.prisma.promoCode.findUnique({ where: { code: promoCode } });
    if (!promo) {
      throw new BadRequestException('Invalid promo code');
    }
    this.validatePromoEligibility(promo, subtotal);
    const computed = this.computePromoDiscount(promo, subtotal, shippingCost);
    return {
      discount: computed.discount,
      promoDiscountType: computed.promoDiscountType,
      promoDiscountValue: computed.promoDiscountValue,
      promoCodeId: promo.id,
      shippingCost: computed.newShippingCost,
    };
  }

  private async resolveLoyaltyRedeem(userId: string, requested: number | undefined, subtotal: number): Promise<number> {
    if (!requested || requested <= 0) return 0;
    const loyaltyData = await this.loyaltyService.getLoyalty(userId);
    const balanceAed = Number(loyaltyData.balanceAed);
    if (requested > balanceAed) {
      throw new BadRequestException(`Insufficient loyalty balance. Available: AED ${balanceAed.toFixed(2)}`);
    }
    // Admin-configured cap (default 30% when unset). Falls back gracefully
    // if the settings service is unavailable.
    let maxRedeemPercent = 0.3;
    try {
      const cfg = await this.settingsService.getLoyaltyConfig();
      const pct = Number(cfg?.maxRedeemPercent);
      if (Number.isFinite(pct) && pct > 0 && pct <= 1) maxRedeemPercent = pct;
    } catch (err: any) {
      this.logger.warn(`Loyalty config lookup failed, using default 30%: ${err?.message ?? err}`);
    }
    const maxRedeemable = subtotal * maxRedeemPercent;
    if (requested > maxRedeemable) {
      throw new BadRequestException(
        `Loyalty redemption cannot exceed ${Math.round(maxRedeemPercent * 100)}% of subtotal (max: AED ${maxRedeemable.toFixed(2)})`,
      );
    }
    return requested;
  }

  private async resolvePaymentStatus(
    paymentMethod: PaymentMethodDto,
    paymentIntentDtoId: string | undefined,
  ): Promise<{ initialPaymentStatus: PaymentStatus; initialOrderStatus: OrderStatus; paymentIntentId: string | null }> {
    if (paymentMethod === PaymentMethodDto.CASH_ON_DELIVERY) {
      return {
        initialPaymentStatus: PaymentStatus.PENDING,
        initialOrderStatus: OrderStatus.PROCESSING,
        paymentIntentId: null,
      };
    }
    if (paymentMethod !== PaymentMethodDto.CREDIT_CARD) {
      return {
        initialPaymentStatus: PaymentStatus.PENDING,
        initialOrderStatus: OrderStatus.PAYMENT_PENDING,
        paymentIntentId: null,
      };
    }
    if (!paymentIntentDtoId) {
      throw new BadRequestException('Payment intent ID is required for credit card payments');
    }
    try {
      const pi = await this.stripeService.verifyPaymentIntent(paymentIntentDtoId);
      if (pi.status === 'succeeded') {
        return { initialPaymentStatus: PaymentStatus.PAID, initialOrderStatus: OrderStatus.PROCESSING, paymentIntentId: pi.id };
      }
      if (pi.status === 'requires_capture') {
        return { initialPaymentStatus: PaymentStatus.PENDING, initialOrderStatus: OrderStatus.PAYMENT_PENDING, paymentIntentId: pi.id };
      }
      throw new BadRequestException(`Payment not completed. Status: ${pi.status}`);
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Failed to verify payment. Please try again.');
    }
  }

  private createAddressFromExisting(_tx: any, _userId: string, source: any): Promise<string> {
    // Use the existing saved address directly — no copy needed.
    return Promise.resolve(source.id);
  }

  private async createAddressFromInline(tx: any, userId: string, source: any): Promise<string> {
    const created = await tx.address.create({
      data: {
        userId,
        firstName: source.firstName,
        lastName: source.lastName,
        addressLine1: source.street,
        addressLine2: source.apartment,
        city: source.city,
        postalCode: source.postalCode,
        phone: source.phone || '',
      },
    });
    return created.id;
  }

  private async resolveBillingAddressId(
    tx: any,
    userId: string,
    shippingAddressId: string,
    existingBillingAddress: any,
    inlineBillingAddress: any,
    fallbackInlineShipping: any,
  ): Promise<string> {
    if (existingBillingAddress) {
      return this.createAddressFromExisting(tx, userId, existingBillingAddress);
    }
    if (inlineBillingAddress) {
      return this.createAddressFromInline(tx, userId, inlineBillingAddress);
    }
    if (fallbackInlineShipping) {
      return this.createAddressFromInline(tx, userId, fallbackInlineShipping);
    }
    return shippingAddressId;
  }

  private async createOrderAddresses(
    tx: any,
    userId: string,
    ctx: {
      existingAddress: any;
      existingBillingAddress: any;
      shippingAddress: any;
      billingAddress: any;
    },
  ): Promise<{ orderShippingAddressId: string; orderBillingAddressId: string }> {
    let orderShippingAddressId: string;
    if (ctx.existingAddress) {
      orderShippingAddressId = await this.createAddressFromExisting(tx, userId, ctx.existingAddress);
    } else {
      if (!ctx.shippingAddress) {
        throw new BadRequestException('Shipping address data is required');
      }
      orderShippingAddressId = await this.createAddressFromInline(tx, userId, ctx.shippingAddress);
    }
    const orderBillingAddressId = await this.resolveBillingAddressId(
      tx,
      userId,
      orderShippingAddressId,
      ctx.existingBillingAddress,
      ctx.billingAddress,
      ctx.existingAddress ? null : ctx.shippingAddress,
    );
    return { orderShippingAddressId, orderBillingAddressId };
  }

  private async finalizeLoyaltyEarn(orderId: string, subtotal: number, loyaltyRedeemAed: number, order: any, userId: string): Promise<any> {
    const earnPercent = await this.getLoyaltyEarnPercent();
    const eligibleForEarn = Math.max(0, subtotal - loyaltyRedeemAed);
    const loyaltyEarnAed = Math.round(eligibleForEarn * earnPercent * 100) / 100;
    if (loyaltyEarnAed <= 0) return order;

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { loyaltyEarnAed },
      include: { items: true, shippingAddress: true, billingAddress: true },
    });

    // Credit the earned amount as PENDING in the loyalty wallet — it will
    // be CONFIRMED on DELIVERED, or REVERSED on cancellation/refund before
    // delivery. Non-fatal: a wallet failure here must not roll back the order.
    try {
      await this.loyaltyService.addPendingLoyaltyCash(
        userId,
        loyaltyEarnAed,
        orderId,
        `Pending earn from order ${updated.orderNumber}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Pending loyalty credit failed for order ${orderId}: ${err?.message ?? err}`,
      );
    }

    return updated;
  }

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const {
      shippingAddressId, shippingAddress, billingAddressId, billingAddress,
      shippingMethod, paymentMethod, items, promoCode, notes,
    } = createOrderDto;

    if (!shippingAddressId && !shippingAddress) {
      throw new BadRequestException('Either shippingAddressId or shippingAddress must be provided');
    }
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const { existingAddress, existingBillingAddress } = await this.resolveSavedAddresses(
      userId, shippingAddressId, billingAddressId,
    );

    const products = await this.loadOrderProducts(items);
    await this.checkOrderStock(items);

    const vatRate = await this.settingsService.getVatRate();
    const { orderItems, subtotalExclVat, totalVatAmount } = this.buildOrderItemsAndTotals(items, products, vatRate);
    const subtotal = subtotalExclVat + totalVatAmount;

    const initialShippingCost = await this.calculateShippingCost(
      shippingMethod as unknown as ShippingMethod,
      subtotal,
    );
    const promoResult = await this.resolvePromoCode(promoCode, subtotal, initialShippingCost);
    const { discount, promoDiscountType, promoDiscountValue, promoCodeId } = promoResult;
    const shippingCost = promoResult.shippingCost;
    const shippingExclVat = shippingCost;
    const shippingVatAmount = 0;

    const loyaltyRedeemAed = await this.resolveLoyaltyRedeem(userId, createOrderDto.loyaltyRedeemAed, subtotal);
    const total = Math.round((subtotal + shippingCost - discount - loyaltyRedeemAed) * 100) / 100;

    const orderNumber = await this.generateOrderNumber();
    const { initialPaymentStatus, initialOrderStatus, paymentIntentId } = await this.resolvePaymentStatus(
      paymentMethod, createOrderDto.paymentIntentId,
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const { orderShippingAddressId, orderBillingAddressId } = await this.createOrderAddresses(tx, userId, {
        existingAddress, existingBillingAddress, shippingAddress, billingAddress,
      });
      const billingInvoiceCompany = createOrderDto.billingInvoiceCompany?.trim().substring(0, 60) || null;
      const billingInvoiceVatNumber = createOrderDto.billingInvoiceVatNumber?.trim().substring(0, 60) || null;

      const newOrder = await tx.order.create({
        data: {
          orderNumber, userId,
          status: initialOrderStatus,
          paymentStatus: initialPaymentStatus,
          shippingAddressId: orderShippingAddressId,
          billingAddressId: orderBillingAddressId,
          shippingMethod: shippingMethod as unknown as ShippingMethod,
          shippingCost, subtotal, discount,
          vat: totalVatAmount, total,
          subtotalExclVat,
          vatAmount: totalVatAmount,
          totalInclVat: total,
          vatRateSnapshot: vatRate,
          shippingExclVat, shippingVatAmount,
          promoCode, promoDiscountType, promoDiscountValue, paymentIntentId,
          loyaltyRedeemAed: loyaltyRedeemAed > 0 ? loyaltyRedeemAed : null,
          paymentMethod: paymentMethod as unknown as PaymentMethod,
          notes, billingInvoiceCompany, billingInvoiceVatNumber,
          items: { create: orderItems },
          statusHistory: {
            create: {
              status: initialOrderStatus,
              notes: paymentMethod === PaymentMethodDto.CASH_ON_DELIVERY
                ? 'Order placed with Cash on Delivery'
                : 'Order placed, awaiting payment',
            },
          },
        },
        include: { items: true, shippingAddress: true, billingAddress: true },
      });

      await this.stockService.reserveStockBatch(
        orderItems
          .filter(item => item.productId != null)
          .map(item => ({ productId: item.productId, quantity: item.quantity })),
        newOrder.id,
        userId,
        tx, // enroll in the outer transaction to avoid nested-tx split-brain
      );
      return newOrder;
    });

    if (loyaltyRedeemAed > 0) {
      await this.loyaltyService.redeemLoyaltyCash(
        userId, loyaltyRedeemAed, order.id, `Redeemed on order ${order.orderNumber}`,
      );
    }
    if (promoCodeId) {
      await this.prisma.promoCode.update({
        where: { id: promoCodeId },
        data: { usageCount: { increment: 1 } },
      });
    }

    const finalOrder = await this.finalizeLoyaltyEarn(order.id, subtotal, loyaltyRedeemAed, order, userId);

    // Fire-and-forget invoice generation + email (do not block order response on failure)
    this.issueInvoiceAndEmail(order.id).catch((err) =>
      this.logger.error(`Invoice issuance threw for order ${order.id}: ${err?.message}`),
    );

    return this.formatOrderResponse(finalOrder);
  }

  private async handleStockTransition(
    newStatus: OrderStatus,
    oldStatus: OrderStatus,
    stockItems: Array<{ productId: number; quantity: number }>,
    orderId: string,
    userId?: string,
  ): Promise<void> {
    if (stockItems.length === 0) return;

    if (newStatus === OrderStatus.PROCESSING && oldStatus === OrderStatus.PAYMENT_PENDING) {
      await this.stockService.confirmReservationBatch(stockItems, orderId, userId);
      this.logger.log(`Confirmed stock reservation for order ${orderId}`);
      return;
    }

    if (newStatus === OrderStatus.REFUNDED) {
      await this.stockService.restoreStockBatch(stockItems, orderId, userId);
      this.logger.log(`Restored stock for refunded order ${orderId}`);
      return;
    }

    if (newStatus !== OrderStatus.CANCELLED) return;

    const isPreConfirm = oldStatus === OrderStatus.PENDING || oldStatus === OrderStatus.PAYMENT_PENDING;
    const isPostConfirm =
      oldStatus === OrderStatus.PROCESSING ||
      oldStatus === OrderStatus.PAID ||
      oldStatus === OrderStatus.SHIPPED;

    if (isPreConfirm) {
      await this.stockService.releaseReservationBatch(stockItems, orderId, userId);
      this.logger.log(`Released stock reservation for cancelled order ${orderId}`);
    } else if (isPostConfirm) {
      await this.stockService.restoreStockBatch(stockItems, orderId, userId);
      this.logger.log(`Restored stock for cancelled order ${orderId}`);
    }
  }

  private buildOrderStatusUpdateData(
    newStatus: OrderStatus,
    oldStatus: OrderStatus,
    paymentStatus: PaymentStatus,
    notes?: string,
  ): any {
    const updateData: any = {
      status: newStatus,
      statusHistory: {
        create: {
          status: newStatus,
          notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
        },
      },
    };
    if (newStatus === OrderStatus.PROCESSING && paymentStatus === PaymentStatus.PENDING) {
      updateData.paymentStatus = PaymentStatus.PAID;
      updateData.paidAt = new Date();
    }
    if (newStatus === OrderStatus.REFUNDED) {
      updateData.paymentStatus = PaymentStatus.REFUNDED;
    }
    return updateData;
  }

  /**
   * Apply stock-lifecycle side effects for a status transition without
   * actually updating the order row. Callers (e.g. admin endpoints) update
   * the order separately. Idempotent / no-op for transitions that don't
   * affect stock (e.g. PROCESSING -> SHIPPED).
   */
  async applyStockLifecycle(
    orderId: string,
    newStatus: OrderStatus,
    userId?: string,
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const stockItems = order.items
      .filter((item): item is typeof item & { productId: number } => item.productId != null)
      .map(item => ({ productId: item.productId, quantity: item.quantity }));
    await this.handleStockTransition(newStatus, order.status, stockItems, orderId, userId);
    // Loyalty side-effects mirror the stock lifecycle: confirm pending on
    // DELIVERED, reverse pending on CANCELLED/REFUNDED before delivery.
    // Non-fatal — logged + swallowed so admin status update never 500s
    // because of a loyalty wallet hiccup.
    try {
      await this.applyLoyaltyLifecycle(orderId, newStatus, order.status);
    } catch (err: any) {
      this.logger.error(
        `Loyalty lifecycle failed for order ${orderId} ${order.status} -> ${newStatus}: ${err?.message ?? err}`,
      );
    }
  }

  /**
   * Apply loyalty-wallet side effects for a status transition. Idempotent.
   * - DELIVERED: confirm the pending earn (move pending -> balance).
   * - CANCELLED/REFUNDED before delivery: reverse the pending earn.
   * - Returns after delivery are handled by returns.service.reverseLoyaltyEarned.
   */
  private async applyLoyaltyLifecycle(
    orderId: string,
    newStatus: OrderStatus,
    oldStatus: OrderStatus,
  ): Promise<void> {
    if (newStatus === oldStatus) return;

    if (newStatus === OrderStatus.DELIVERED) {
      await this.loyaltyService.confirmPendingLoyaltyCash(orderId);
      return;
    }

    if (newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.REFUNDED) {
      // If the order was already delivered, the credit is in balanceAed.
      // Refunds-after-delivery are handled by returns.service. We only
      // touch pending here.
      if (oldStatus !== OrderStatus.DELIVERED) {
        const reason = newStatus === OrderStatus.CANCELLED ? 'order cancelled' : 'order refunded';
        await this.loyaltyService.reversePendingLoyaltyCash(orderId, reason);
      }
    }
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

    await this.handleStockTransition(newStatus, oldStatus, stockItems, orderId, userId);
    try {
      await this.applyLoyaltyLifecycle(orderId, newStatus, oldStatus);
    } catch (err: any) {
      this.logger.error(
        `Loyalty lifecycle failed for order ${orderId} ${oldStatus} -> ${newStatus}: ${err?.message ?? err}`,
      );
    }

    const updateData = this.buildOrderStatusUpdateData(newStatus, oldStatus, order.paymentStatus, notes);

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

    // Auto-create with default value
    setting ??= await this.prisma.siteSetting.create({
      data: {
        key,
        value: '0.05',
        type: 'number',
        group: 'loyalty',
        label: 'Loyalty Earn Percent (e.g., 0.05 = 5%)',
      },
    });

    const parsed = Number.parseFloat(setting.value);
    return Number.isNaN(parsed) ? 0.05 : parsed;
  }

  async getOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const shippingIds = Array.from(
      new Set(orders.map((o) => o.shippingAddressId).filter(Boolean) as string[]),
    );
    const shippingAddresses = shippingIds.length
      ? await this.prisma.address.findMany({ where: { id: { in: shippingIds } } })
      : [];
    const addrMap = new Map(shippingAddresses.map((a) => [a.id, a]));

    return orders.map(order =>
      this.formatOrderResponse({
        ...order,
        shippingAddress: order.shippingAddressId ? addrMap.get(order.shippingAddressId) ?? null : null,
      }),
    );
  }

  async getOrderById(userId: string, orderId: string) {
    const baseOrder = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!baseOrder) {
      throw new NotFoundException('Order not found');
    }

    const [shippingAddress, billingAddress, returnedByItemId] = await Promise.all([
      baseOrder.shippingAddressId
        ? this.prisma.address.findUnique({ where: { id: baseOrder.shippingAddressId } }).catch(() => null)
        : null,
      baseOrder.billingAddressId
        ? this.prisma.address.findUnique({ where: { id: baseOrder.billingAddressId } }).catch(() => null)
        : null,
      this.computeReturnedByItem(orderId),
    ]);

    return this.formatOrderResponse({ ...baseOrder, shippingAddress, billingAddress, returnedByItemId });
  }

  /** Sum of returned quantities per orderItemId across all non-rejected/non-cancelled returns. */
  private async computeReturnedByItem(orderId: string): Promise<Record<string, number>> {
    const items = await this.prisma.returnItem.findMany({
      where: {
        return: {
          orderId,
          status: { notIn: ['REJECTED', 'CANCELLED'] },
        },
      },
      select: { orderItemId: true, quantity: true },
    });
    const map: Record<string, number> = {};
    for (const it of items) {
      map[it.orderItemId] = (map[it.orderItemId] ?? 0) + it.quantity;
    }
    return map;
  }

  async getAllOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        include: {
          items: true,
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count(),
    ]);

    const shippingIds = Array.from(
      new Set(orders.map((o) => o.shippingAddressId).filter(Boolean) as string[]),
    );
    const shippingAddresses = shippingIds.length
      ? await this.prisma.address.findMany({ where: { id: { in: shippingIds } } })
      : [];
    const addrMap = new Map(shippingAddresses.map((a) => [a.id, a]));

    return {
      data: orders.map(order =>
        this.formatOrderResponse({
          ...order,
          shippingAddress: order.shippingAddressId ? addrMap.get(order.shippingAddressId) ?? null : null,
        }),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async calculateShippingCost(method: ShippingMethod, subtotal: number = 0): Promise<number> {
    // PICKUP is always free; every other method uses the admin-configured shipping fee.
    // The fee is mandatory and centrally managed via SiteSetting `shipping_fee`
    // (default AED 10, auto-seeded on first read).
    // If `shipping_free_threshold` > 0 and order subtotal meets it, shipping is waived.
    if (method === ShippingMethod.PICKUP) return 0;
    const threshold = await this.settingsService.getFreeShippingThreshold();
    if (threshold > 0 && subtotal >= threshold) return 0;
    return this.settingsService.getShippingFee();
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
        returnedQuantity: order.returnedByItemId?.[item.id] ?? 0,
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
