import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computePromoStatus } from '../promos/promo-status.util';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Revenue over time — daily aggregation for a date range
   */
  async getRevenueTimeSeries(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { notIn: ['CANCELLED', 'REFUNDED'] as any[] },
      },
      select: {
        createdAt: true,
        total: true,
        subtotal: true,
        vat: true,
        discount: true,
        shippingCost: true,
        vatAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const byDay = new Map<string, { revenue: number; orders: number; vat: number; discount: number; shipping: number }>();
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const e = byDay.get(key) || { revenue: 0, orders: 0, vat: 0, discount: 0, shipping: 0 };
      e.revenue += Number(o.total || 0);
      e.orders += 1;
      e.vat += Number(o.vat || o.vatAmount || 0);
      e.discount += Number(o.discount || 0);
      e.shipping += Number(o.shippingCost || 0);
      byDay.set(key, e);
    }

    // Fill gaps so the chart has every day
    const result: any[] = [];
    const cursor = new Date(since);
    const today = new Date();
    while (cursor <= today) {
      const key = cursor.toISOString().slice(0, 10);
      const e = byDay.get(key) || { revenue: 0, orders: 0, vat: 0, discount: 0, shipping: 0 };
      result.push({ date: key, ...e });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  /**
   * Financial summary KPI tiles
   */
  async getFinancialSummary() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const notCancelled = { status: { notIn: ['CANCELLED', 'REFUNDED'] as any } };

    const [todayAgg, weekAgg, monthAgg, prevMonthAgg, allTimeAgg, totalOrders, totalCustomers] = await Promise.all([
      this.prisma.order.aggregate({ where: { ...notCancelled, createdAt: { gte: todayStart } }, _sum: { total: true, vat: true, discount: true }, _count: true }),
      this.prisma.order.aggregate({ where: { ...notCancelled, createdAt: { gte: weekStart } }, _sum: { total: true, vat: true, discount: true }, _count: true }),
      this.prisma.order.aggregate({ where: { ...notCancelled, createdAt: { gte: monthStart } }, _sum: { total: true, vat: true, discount: true }, _count: true }),
      this.prisma.order.aggregate({ where: { ...notCancelled, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { total: true }, _count: true }),
      this.prisma.order.aggregate({ where: notCancelled, _sum: { total: true, vat: true, discount: true, shippingCost: true }, _count: true }),
      this.prisma.order.count(),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);

    const monthRevenue = Number(monthAgg._sum.total || 0);
    const prevMonthRevenue = Number(prevMonthAgg._sum.total || 0);
    const monthGrowth = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;
    const avgOrderValue = allTimeAgg._count > 0 ? Number(allTimeAgg._sum.total || 0) / allTimeAgg._count : 0;

    return {
      today: { revenue: Number(todayAgg._sum.total || 0), orders: todayAgg._count, vat: Number(todayAgg._sum.vat || 0), discount: Number(todayAgg._sum.discount || 0) },
      week: { revenue: Number(weekAgg._sum.total || 0), orders: weekAgg._count, vat: Number(weekAgg._sum.vat || 0), discount: Number(weekAgg._sum.discount || 0) },
      month: { revenue: monthRevenue, orders: monthAgg._count, vat: Number(monthAgg._sum.vat || 0), discount: Number(monthAgg._sum.discount || 0) },
      allTime: { revenue: Number(allTimeAgg._sum.total || 0), orders: allTimeAgg._count, vat: Number(allTimeAgg._sum.vat || 0), discount: Number(allTimeAgg._sum.discount || 0), shipping: Number(allTimeAgg._sum.shippingCost || 0) },
      monthGrowthPercent: Math.round(monthGrowth * 10) / 10,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalOrders,
      totalCustomers,
    };
  }

  /**
   * Orders by status + by payment method pie-chart data
   */
  async getOrderBreakdown() {
    const [byStatus, byPayment, byShipping] = await Promise.all([
      this.prisma.order.groupBy({ by: ['status'], _count: { id: true }, _sum: { total: true } }),
      this.prisma.order.groupBy({ by: ['paymentMethod'], _count: { id: true }, _sum: { total: true } }),
      this.prisma.order.groupBy({ by: ['shippingMethod'], _count: { id: true }, _sum: { total: true } }),
    ]);

    return {
      byStatus: byStatus.map(s => ({ label: s.status, count: s._count.id, revenue: Number(s._sum.total || 0) })),
      byPayment: byPayment.map(p => ({ label: p.paymentMethod, count: p._count.id, revenue: Number(p._sum.total || 0) })),
      byShipping: byShipping.map(s => ({ label: s.shippingMethod, count: s._count.id, revenue: Number(s._sum.total || 0) })),
    };
  }

  /**
   * Top selling products with revenue
   */
  async getTopProducts(limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, subtotal: true },
      _count: { orderId: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: limit,
    });

    const productIds = items.map(i => i.productId).filter((id): id is number => id !== null);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productName: true, sku: true },
    });
    const pMap = new Map(products.map(p => [p.id, p]));

    return items.map(i => {
      const p = i.productId ? pMap.get(i.productId) : null;
      return {
        productId: i.productId,
        name: p?.productName || 'Unknown',
        sku: p?.sku || 'N/A',
        totalRevenue: Number(i._sum.subtotal || 0),
        totalQty: i._sum.quantity || 0,
        totalOrders: i._count.orderId,
      };
    });
  }

  /**
   * Inventory / stock report — low stock items, stock distribution
   */
  async getStockReport() {
    // Pull from Products table (primary source of truth). Some products may
    // also have product_variants; if so, sum variant stock and prefer that
    // total over Product.stockQty.
    const products = await this.prisma.product.findMany({
      where: { isActive: true, isDiscontinued: false },
      select: {
        id: true,
        productName: true,
        sku: true,
        stockQty: true,
        lowStockAlert: true,
        isActive: true,
        product_variants: {
          where: { is_active: true },
          select: { id: true, stock_qty: true, sku: true },
        },
      },
    });

    type Item = { variantId: number | null; productId: number; productName: string; sku: string; stockQty: number; lowStockAlert: number; isActive: boolean };
    const items: Item[] = [];
    for (const p of products) {
      const threshold = p.lowStockAlert ?? 5;
      if (p.product_variants.length > 0) {
        for (const v of p.product_variants) {
          items.push({
            variantId: v.id,
            productId: p.id,
            productName: p.productName,
            sku: v.sku || p.sku,
            stockQty: v.stock_qty,
            lowStockAlert: threshold,
            isActive: p.isActive,
          });
        }
      } else {
        items.push({
          variantId: null,
          productId: p.id,
          productName: p.productName,
          sku: p.sku,
          stockQty: p.stockQty,
          lowStockAlert: threshold,
          isActive: p.isActive,
        });
      }
    }

    // Honour each product's own lowStockAlert (default 5) instead of a magic
    // number, so admins can configure thresholds per product.
    const lowStock = items.filter((v) => v.stockQty <= v.lowStockAlert && v.stockQty > 0);
    const outOfStock = items.filter((v) => v.stockQty <= 0);
    const healthy = items.filter((v) => v.stockQty > v.lowStockAlert);

    const distribution = [
      { label: 'Out of Stock (0)', count: outOfStock.length },
      { label: 'Critical (1-5)', count: lowStock.length },
      { label: 'Low (6-20)', count: items.filter(v => v.stockQty > 5 && v.stockQty <= 20).length },
      { label: 'Normal (21-100)', count: items.filter(v => v.stockQty > 20 && v.stockQty <= 100).length },
      { label: 'High (100+)', count: items.filter(v => v.stockQty > 100).length },
    ];

    const totalStockUnits = items.reduce((sum, v) => sum + v.stockQty, 0);
    const sortedLow = [...outOfStock, ...lowStock].sort((a, b) => a.stockQty - b.stockQty);

    return {
      totalVariants: items.length,
      totalStockUnits,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      healthyCount: healthy.length,
      distribution,
      lowStockItems: sortedLow.slice(0, 20),
    };
  }

  /**
   * Customer analytics — growth, segments
   */
  async getCustomerAnalytics(days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // New customers per day
    const customers = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER', createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDay = new Map<string, number>();
    for (const c of customers) {
      const key = c.createdAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }

    const growthSeries: any[] = [];
    const cursor = new Date(since);
    const today = new Date();
    let cumulative = 0;
    while (cursor <= today) {
      const key = cursor.toISOString().slice(0, 10);
      const count = byDay.get(key) || 0;
      cumulative += count;
      growthSeries.push({ date: key, newCustomers: count, cumulative });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Top spenders
    const topSpenders = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { status: { notIn: ['CANCELLED', 'REFUNDED'] as any } },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });

    const userIds = topSpenders.map(s => s.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const uMap = new Map(users.map(u => [u.id, u]));

    // Returning vs new (customers w/ >1 order vs 1 order)
    const orderCountByUser = await this.prisma.order.groupBy({
      by: ['userId'],
      _count: { id: true },
    });
    const oneOrder = orderCountByUser.filter(u => u._count.id === 1).length;
    const returning = orderCountByUser.filter(u => u._count.id > 1).length;

    return {
      totalCustomers: await this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      newCustomersToday: await this.prisma.user.count({
        where: { role: 'CUSTOMER', createdAt: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
      }),
      growthSeries,
      topSpenders: topSpenders.map(s => {
        const u = uMap.get(s.userId);
        return {
          userId: s.userId,
          name: u ? `${u.firstName} ${u.lastName}` : 'Unknown',
          email: u?.email || '',
          totalSpent: Number(s._sum.total || 0),
          orderCount: s._count.id,
        };
      }),
      segments: {
        firstTime: oneOrder,
        returning,
      },
    };
  }

  /**
   * VAT summary
   */
  async getVatReport(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { notIn: ['CANCELLED', 'REFUNDED'] as any },
      },
      select: {
        createdAt: true,
        vat: true,
        vatAmount: true,
        subtotal: true,
        total: true,
        subtotalExclVat: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate monthly
    const byMonth = new Map<string, { vatCollected: number; totalRevenue: number; orderCount: number }>();
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const e = byMonth.get(key) || { vatCollected: 0, totalRevenue: 0, orderCount: 0 };
      e.vatCollected += Number(o.vat || o.vatAmount || 0);
      e.totalRevenue += Number(o.total || 0);
      e.orderCount += 1;
      byMonth.set(key, e);
    }

    let totalVat = 0;
    let totalRev = 0;
    for (const o of orders) {
      totalVat += Number(o.vat || o.vatAmount || 0);
      totalRev += Number(o.total || 0);
    }

    const netRevenue = totalRev - totalVat;

    return {
      periodDays: days,
      totalVatCollected: Math.round(totalVat * 100) / 100,
      totalRevenue: Math.round(totalRev * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
      effectiveRate: 5,
      monthlySeries: Array.from(byMonth.entries()).map(([month, data]) => ({
        month,
        ...data,
        vatCollected: Math.round(data.vatCollected * 100) / 100,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
      })),
    };
  }

  /**
   * Category performance
   */
  async getCategoryPerformance() {
    // Get all order items with product's category
    const items = await this.prisma.orderItem.findMany({
      where: { order: { status: { notIn: ['CANCELLED', 'REFUNDED'] as any } } },
      select: {
        quantity: true,
        subtotal: true,
        productId: true,
      },
    });

    const productIds = [...new Set(items.map(i => i.productId).filter((id): id is number => id !== null))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, categoryId: true },
    });
    const pMap = new Map(products.map(p => [p.id, p.categoryId]));

    const categories = await this.prisma.category.findMany({
      select: { id: true, name: true },
    });
    const cMap = new Map(categories.map(c => [c.id, c.name]));

    const byCat = new Map<number, { name: string; revenue: number; qty: number; orders: number }>();
    for (const item of items) {
      if (!item.productId) continue;
      const catId = pMap.get(item.productId);
      if (!catId) continue;
      const e = byCat.get(catId) || { name: cMap.get(catId) || 'Unknown', revenue: 0, qty: 0, orders: 0 };
      e.revenue += Number(item.subtotal || 0);
      e.qty += item.quantity;
      e.orders += 1;
      byCat.set(catId, e);
    }

    return Array.from(byCat.entries())
      .map(([id, data]) => ({ categoryId: id, ...data, revenue: Math.round(data.revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Promo codes usage report
   */
  async getPromoReport() {
    const promos = await this.prisma.promoCode.findMany({
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        usageCount: true,
        usageLimit: true,
        isActive: true,
        startsAt: true,
        expiresAt: true,
      },
      orderBy: { usageCount: 'desc' },
    });

    // Revenue generated via promo codes
    const promoOrders = await this.prisma.order.groupBy({
      by: ['promoCode'],
      where: {
        promoCode: { not: null },
        status: { notIn: ['CANCELLED', 'REFUNDED'] as any },
      },
      _count: { id: true },
      _sum: { total: true, discount: true },
    });

    const promoMap = new Map(promoOrders.map(p => [p.promoCode, {
      orderCount: p._count.id,
      totalRevenue: Number(p._sum.total || 0),
      totalDiscount: Number(p._sum.discount || 0),
    }]));

    return promos.map(p => ({
      id: p.id,
      code: p.code,
      discountType: p.type,
      discountValue: Number(p.value),
      usageCount: p.usageCount,
      usageLimit: p.usageLimit,
      isActive: p.isActive,
      startsAt: p.startsAt,
      expiresAt: p.expiresAt,
      // Computed lifecycle status — UI must render this, not raw isActive,
      // otherwise expired/exhausted codes look "Active" on the dashboard.
      status: computePromoStatus(p),
      orderCount: promoMap.get(p.code)?.orderCount || 0,
      totalRevenue: Math.round((promoMap.get(p.code)?.totalRevenue || 0) * 100) / 100,
      totalDiscount: Math.round((promoMap.get(p.code)?.totalDiscount || 0) * 100) / 100,
    }));
  }

  // ========================================================================
  // EXTENDED HOLISTIC REPORTS
  // (All use existing schema data — no new tracking required)
  // ========================================================================

  /**
   * Refund / Returns analytics
   */
  async getRefundReport(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [returns, byReason, byStatus, ordersInPeriod, refundedOrders] = await Promise.all([
      this.prisma.return.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, status: true, refundAmount: true, reason: true, createdAt: true, completedAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.return.groupBy({
        by: ['reason'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        _sum: { refundAmount: true },
      }),
      this.prisma.return.groupBy({
        by: ['status'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        _sum: { refundAmount: true },
      }),
      this.prisma.order.count({ where: { createdAt: { gte: since } } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: since }, status: 'REFUNDED' },
        _sum: { total: true },
        _count: true,
      }),
    ]);

    const totalRefunded = returns.reduce((s, r) => s + Number(r.refundAmount || 0), 0);
    const refundRate = ordersInPeriod > 0 ? (returns.length / ordersInPeriod) * 100 : 0;

    // Daily series of refund $
    const byDay = new Map<string, { count: number; amount: number }>();
    for (const r of returns) {
      const k = r.createdAt.toISOString().slice(0, 10);
      const e = byDay.get(k) || { count: 0, amount: 0 };
      e.count += 1;
      e.amount += Number(r.refundAmount || 0);
      byDay.set(k, e);
    }
    const series: any[] = [];
    const cur = new Date(since);
    const today = new Date();
    while (cur <= today) {
      const k = cur.toISOString().slice(0, 10);
      const e = byDay.get(k) || { count: 0, amount: 0 };
      series.push({ date: k, ...e, amount: Math.round(e.amount * 100) / 100 });
      cur.setDate(cur.getDate() + 1);
    }

    // avg processing time (created→completed)
    const completed = returns.filter(r => r.completedAt);
    const avgDays = completed.length
      ? completed.reduce((s, r) => s + (r.completedAt!.getTime() - r.createdAt.getTime()) / 86400000, 0) / completed.length
      : 0;

    return {
      periodDays: days,
      totalReturns: returns.length,
      totalRefundAmount: Math.round(totalRefunded * 100) / 100,
      refundRatePercent: Math.round(refundRate * 10) / 10,
      avgProcessingDays: Math.round(avgDays * 10) / 10,
      refundedOrdersCount: refundedOrders._count,
      refundedOrdersValue: Math.round(Number(refundedOrders._sum.total || 0) * 100) / 100,
      byReason: byReason
        .map(r => ({ reason: r.reason, count: r._count.id, amount: Math.round(Number(r._sum.refundAmount || 0) * 100) / 100 }))
        .sort((a, b) => b.count - a.count),
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id, amount: Math.round(Number(s._sum.refundAmount || 0) * 100) / 100 })),
      series,
    };
  }

  /**
   * Inventory valuation — capital tied in stock
   */
  async getInventoryValuation() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        productName: true,
        sku: true,
        stockQty: true,
        categoryId: true,
        brandId: true,
        pricing: { select: { cost_price_aed: true, price_excl_vat_aed: true } },
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
    });

    let totalCostValue = 0;
    let totalRetailValue = 0;
    let totalUnits = 0;
    const byCategory = new Map<string, { name: string; cost: number; retail: number; units: number }>();
    const byBrand = new Map<string, { name: string; cost: number; retail: number; units: number }>();

    const items = products.map(p => {
      const cost = Number(p.pricing?.cost_price_aed || 0);
      const retail = Number(p.pricing?.price_excl_vat_aed || 0);
      const costValue = cost * p.stockQty;
      const retailValue = retail * p.stockQty;
      totalCostValue += costValue;
      totalRetailValue += retailValue;
      totalUnits += p.stockQty;

      const catKey = p.categoryId ? String(p.categoryId) : 'uncategorized';
      const cE = byCategory.get(catKey) || { name: p.category?.name || 'Uncategorized', cost: 0, retail: 0, units: 0 };
      cE.cost += costValue; cE.retail += retailValue; cE.units += p.stockQty;
      byCategory.set(catKey, cE);

      const brKey = p.brandId ? String(p.brandId) : 'unbranded';
      const bE = byBrand.get(brKey) || { name: p.brand?.name || 'Unbranded', cost: 0, retail: 0, units: 0 };
      bE.cost += costValue; bE.retail += retailValue; bE.units += p.stockQty;
      byBrand.set(brKey, bE);

      return { productId: p.id, name: p.productName, sku: p.sku, stockQty: p.stockQty, costValue: Math.round(costValue * 100) / 100, retailValue: Math.round(retailValue * 100) / 100 };
    });

    const topByValue = items
      .filter(i => i.retailValue > 0)
      .sort((a, b) => b.retailValue - a.retailValue)
      .slice(0, 15);

    return {
      totalUnits,
      totalCostValue: Math.round(totalCostValue * 100) / 100,
      totalRetailValue: Math.round(totalRetailValue * 100) / 100,
      potentialMargin: Math.round((totalRetailValue - totalCostValue) * 100) / 100,
      productCount: products.length,
      byCategory: Array.from(byCategory.values())
        .map(e => ({ ...e, cost: Math.round(e.cost * 100) / 100, retail: Math.round(e.retail * 100) / 100 }))
        .sort((a, b) => b.retail - a.retail),
      byBrand: Array.from(byBrand.values())
        .map(e => ({ ...e, cost: Math.round(e.cost * 100) / 100, retail: Math.round(e.retail * 100) / 100 }))
        .sort((a, b) => b.retail - a.retail)
        .slice(0, 20),
      topByValue,
    };
  }

  /**
   * Catalog health — surface data-quality gaps
   */
  async getCatalogHealth() {
    const [
      total,
      inactive,
      discontinued,
      missingDescription,
      missingShortDescription,
      missingPricing,
      missingMetaTitle,
      missingMetaDescription,
      missingBrand,
      missingCategory,
      featured,
      isNew,
      bestSeller,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: false } }),
      this.prisma.product.count({ where: { isDiscontinued: true } }),
      this.prisma.product.count({ where: { OR: [{ description: null }, { description: '' }] } }),
      this.prisma.product.count({ where: { OR: [{ shortDescription: null }, { shortDescription: '' }] } }),
      this.prisma.product.count({ where: { pricing: null } }),
      this.prisma.product.count({ where: { OR: [{ metaTitle: null }, { metaTitle: '' }] } }),
      this.prisma.product.count({ where: { OR: [{ metaDescription: null }, { metaDescription: '' }] } }),
      this.prisma.product.count({ where: { brandId: null } }),
      this.prisma.product.count({ where: { categoryId: null } }),
      this.prisma.product.count({ where: { isFeatured: true } }),
      this.prisma.product.count({ where: { isNew: true } }),
      this.prisma.product.count({ where: { isBestSeller: true } }),
    ]);

    // Missing images requires a join — count products with zero ProductImage rows
    const productsNoImages = await this.prisma.product.findMany({
      where: { images: { none: {} } },
      select: { id: true, productName: true, sku: true, isActive: true },
      take: 50,
    });

    return {
      total,
      active: total - inactive,
      inactive,
      discontinued,
      featured,
      isNew,
      bestSeller,
      issues: {
        missingImages: productsNoImages.length,
        missingDescription,
        missingShortDescription,
        missingPricing,
        missingMetaTitle,
        missingMetaDescription,
        missingBrand,
        missingCategory,
      },
      missingImagesSample: productsNoImages.slice(0, 20),
      completenessScore: this.computeCompletenessScore(total, {
        missingDescription, missingPricing, missingMetaTitle, missingMetaDescription,
        missingImages: productsNoImages.length,
      }),
    };
  }

  private computeCompletenessScore(total: number, missing: Record<string, number>) {
    if (total === 0) return 100;
    const fields = Object.keys(missing).length;
    const totalSlots = total * fields;
    const filledSlots = totalSlots - Object.values(missing).reduce((s, v) => s + v, 0);
    return Math.round((filledSlots / totalSlots) * 1000) / 10;
  }

  /**
   * Slow movers — products with no orders in window
   */
  async getSlowMovers(days = 90, limit = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Find product ids that DID sell in window
    const sold = await this.prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since }, status: { notIn: ['CANCELLED'] as any } } },
      select: { productId: true },
      distinct: ['productId'],
    });
    const soldIds = new Set(sold.map(s => s.productId).filter((x): x is number => x !== null));

    const slow = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isDiscontinued: false,
        id: { notIn: Array.from(soldIds) },
        stockQty: { gt: 0 },
      },
      select: {
        id: true, productName: true, sku: true, stockQty: true, createdAt: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        pricing: { select: { cost_price_aed: true, price_excl_vat_aed: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return {
      periodDays: days,
      slowMoverCount: slow.length,
      tiedUpValue: Math.round(slow.reduce((s, p) => s + (Number(p.pricing?.cost_price_aed || 0) * p.stockQty), 0) * 100) / 100,
      items: slow.map(p => ({
        productId: p.id,
        name: p.productName,
        sku: p.sku,
        stockQty: p.stockQty,
        category: p.category?.name || null,
        brand: p.brand?.name || null,
        retailValue: Math.round(Number(p.pricing?.price_excl_vat_aed || 0) * p.stockQty * 100) / 100,
        ageDays: Math.floor((Date.now() - p.createdAt.getTime()) / 86400000),
      })),
    };
  }

  /**
   * Returns by product — quality / fit indicators
   */
  async getReturnsByProduct(days = 30, limit = 15) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const grouped = await this.prisma.returnItem.groupBy({
      by: ['productId'],
      where: { return: { createdAt: { gte: since } } },
      _sum: { quantity: true, subtotal: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = grouped.map(g => g.productId).filter((x): x is number => x !== null);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productName: true, sku: true },
    });
    const pMap = new Map(products.map(p => [p.id, p]));

    // Sold qty in same window for rate
    const soldQty = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds }, order: { createdAt: { gte: since } } },
      _sum: { quantity: true },
    });
    const soldMap = new Map(soldQty.map(s => [s.productId, s._sum.quantity || 0]));

    return grouped.map(g => {
      const p = g.productId ? pMap.get(g.productId) : null;
      const returnedQty = g._sum.quantity || 0;
      const sold = (g.productId && soldMap.get(g.productId)) || 0;
      const rate = sold > 0 ? (returnedQty / sold) * 100 : 0;
      return {
        productId: g.productId,
        name: p?.productName || 'Unknown',
        sku: p?.sku || 'N/A',
        returnCount: g._count.id,
        returnedQty,
        soldQty: sold,
        returnRatePercent: Math.round(rate * 10) / 10,
        refundedAmount: Math.round(Number(g._sum.subtotal || 0) * 100) / 100,
      };
    });
  }

  /**
   * Revenue by brand
   */
  async getRevenueByBrand(days = 30, limit = 20) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const items = await this.prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since }, status: { notIn: ['CANCELLED', 'REFUNDED'] as any } } },
      select: { quantity: true, subtotal: true, productId: true },
    });

    const productIds = [...new Set(items.map(i => i.productId).filter((x): x is number => x !== null))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, brandId: true },
    });
    const pMap = new Map(products.map(p => [p.id, p.brandId]));

    const brands = await this.prisma.brand.findMany({ select: { id: true, name: true } });
    const bMap = new Map(brands.map(b => [b.id, b.name]));

    const byBrand = new Map<number, { name: string; revenue: number; qty: number; orders: Set<string> }>();
    for (const item of items) {
      if (!item.productId) continue;
      const brandId = pMap.get(item.productId);
      if (!brandId) continue;
      const e = byBrand.get(brandId) || { name: bMap.get(brandId) || 'Unknown', revenue: 0, qty: 0, orders: new Set() };
      e.revenue += Number(item.subtotal || 0);
      e.qty += item.quantity;
      byBrand.set(brandId, e);
    }

    return Array.from(byBrand.entries())
      .map(([id, d]) => ({ brandId: id, name: d.name, revenue: Math.round(d.revenue * 100) / 100, qty: d.qty }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Subcategory performance
   */
  async getSubcategoryPerformance(days = 30, limit = 25) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const items = await this.prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since }, status: { notIn: ['CANCELLED', 'REFUNDED'] as any } } },
      select: { quantity: true, subtotal: true, productId: true },
    });

    const productIds = [...new Set(items.map(i => i.productId).filter((x): x is number => x !== null))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, subcategoryId: true },
    });
    const pMap = new Map(products.map(p => [p.id, p.subcategoryId]));

    const subs = await this.prisma.subcategory.findMany({ select: { id: true, name: true, category: { select: { name: true } } } });
    const sMap = new Map(subs.map(s => [s.id, { name: s.name, category: s.category?.name || '' }]));

    const bySub = new Map<number, { name: string; category: string; revenue: number; qty: number }>();
    for (const item of items) {
      if (!item.productId) continue;
      const subId = pMap.get(item.productId);
      if (!subId) continue;
      const meta = sMap.get(subId);
      const e = bySub.get(subId) || { name: meta?.name || 'Unknown', category: meta?.category || '', revenue: 0, qty: 0 };
      e.revenue += Number(item.subtotal || 0);
      e.qty += item.quantity;
      bySub.set(subId, e);
    }

    return Array.from(bySub.entries())
      .map(([id, d]) => ({ subcategoryId: id, name: d.name, category: d.category, revenue: Math.round(d.revenue * 100) / 100, qty: d.qty }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Fulfillment SLA — order→ship and ship→deliver times
   */
  async getFulfillmentSLA(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { notIn: ['CANCELLED'] as any } },
      select: { createdAt: true, shippedAt: true, deliveredAt: true, status: true },
    });

    const shipDeltas: number[] = [];
    const deliverDeltas: number[] = [];
    let shippedCount = 0;
    let deliveredCount = 0;

    for (const o of orders) {
      if (o.shippedAt) {
        shippedCount++;
        shipDeltas.push((o.shippedAt.getTime() - o.createdAt.getTime()) / 86400000);
      }
      if (o.shippedAt && o.deliveredAt) {
        deliveredCount++;
        deliverDeltas.push((o.deliveredAt.getTime() - o.shippedAt.getTime()) / 86400000);
      }
    }

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const median = (arr: number[]) => {
      if (!arr.length) return 0;
      const s = [...arr].sort((a, b) => a - b);
      return s[Math.floor(s.length / 2)];
    };

    return {
      periodDays: days,
      ordersAnalyzed: orders.length,
      shippedCount,
      deliveredCount,
      avgOrderToShipDays: Math.round(avg(shipDeltas) * 10) / 10,
      medianOrderToShipDays: Math.round(median(shipDeltas) * 10) / 10,
      avgShipToDeliverDays: Math.round(avg(deliverDeltas) * 10) / 10,
      medianShipToDeliverDays: Math.round(median(deliverDeltas) * 10) / 10,
      avgEndToEndDays: Math.round((avg(shipDeltas) + avg(deliverDeltas)) * 10) / 10,
      shippedWithin24h: shipDeltas.filter(d => d <= 1).length,
      shippedWithin48h: shipDeltas.filter(d => d <= 2).length,
    };
  }

  /**
   * Stuck orders — operational alert
   */
  async getStuckOrders() {
    const now = Date.now();
    const allActive = await this.prisma.order.findMany({
      where: { status: { in: ['PENDING', 'PAYMENT_PENDING', 'PAID', 'PROCESSING'] as any } },
      select: { id: true, orderNumber: true, status: true, total: true, createdAt: true, updatedAt: true, user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = { over3Days: [] as any[], over7Days: [] as any[], over14Days: [] as any[] };
    for (const o of allActive) {
      const ageDays = (now - o.createdAt.getTime()) / 86400000;
      const item = {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total || 0),
        ageDays: Math.floor(ageDays),
        createdAt: o.createdAt,
        customerName: o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Guest',
        customerEmail: o.user?.email || '',
      };
      if (ageDays > 14) buckets.over14Days.push(item);
      else if (ageDays > 7) buckets.over7Days.push(item);
      else if (ageDays > 3) buckets.over3Days.push(item);
    }

    return {
      totalStuck: buckets.over3Days.length + buckets.over7Days.length + buckets.over14Days.length,
      over3DaysCount: buckets.over3Days.length,
      over7DaysCount: buckets.over7Days.length,
      over14DaysCount: buckets.over14Days.length,
      items: [...buckets.over14Days, ...buckets.over7Days, ...buckets.over3Days].slice(0, 30),
    };
  }

  /**
   * Abandoned carts — carts not converted
   */
  async getAbandonedCarts(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const cutoff = new Date(); cutoff.setHours(cutoff.getHours() - 1); // updated > 1h ago = abandoned

    const carts = await this.prisma.cart.findMany({
      where: {
        updatedAt: { gte: since, lte: cutoff },
        items: { some: {} },
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        items: { select: { productId: true, quantity: true } },
        user: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    // Compute approximate cart value
    const productIds = [...new Set(carts.flatMap(c => c.items.map(i => i.productId)).filter((x): x is number => x !== null))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, pricing: { select: { price_incl_vat_aed: true } } },
    });
    const priceMap = new Map(products.map(p => [p.id, Number(p.pricing?.price_incl_vat_aed || 0)]));

    let totalValue = 0;
    let totalItems = 0;
    const enriched = carts.map(c => {
      const value = c.items.reduce((s, i) => s + ((i.productId ? priceMap.get(i.productId) : 0) || 0) * i.quantity, 0);
      totalValue += value;
      totalItems += c.items.length;
      return {
        id: c.id,
        userId: c.userId,
        isGuest: !c.userId,
        customerName: c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Guest',
        email: c.user?.email || '',
        itemCount: c.items.length,
        estimatedValue: Math.round(value * 100) / 100,
        ageHours: Math.round((Date.now() - c.updatedAt.getTime()) / 3600000),
      };
    });

    return {
      periodDays: days,
      abandonedCartCount: carts.length,
      totalLostValue: Math.round(totalValue * 100) / 100,
      avgCartValue: carts.length ? Math.round((totalValue / carts.length) * 100) / 100 : 0,
      totalItemsAbandoned: totalItems,
      guestCarts: enriched.filter(c => c.isGuest).length,
      registeredCarts: enriched.filter(c => !c.isGuest).length,
      topCarts: [...enriched].sort((a, b) => b.estimatedValue - a.estimatedValue).slice(0, 15),
    };
  }

  /**
   * Failed payments
   */
  async getFailedPayments(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const failed = await this.prisma.order.findMany({
      where: { paymentStatus: 'FAILED', createdAt: { gte: since } },
      select: {
        id: true, orderNumber: true, total: true, paymentMethod: true, createdAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totalOrders = await this.prisma.order.count({ where: { createdAt: { gte: since } } });

    const byMethod = new Map<string, number>();
    let totalLost = 0;
    for (const o of failed) {
      byMethod.set(o.paymentMethod, (byMethod.get(o.paymentMethod) || 0) + 1);
      totalLost += Number(o.total || 0);
    }

    return {
      periodDays: days,
      failedCount: failed.length,
      failureRatePercent: totalOrders > 0 ? Math.round((failed.length / totalOrders) * 1000) / 10 : 0,
      totalLostRevenue: Math.round(totalLost * 100) / 100,
      byMethod: Array.from(byMethod.entries()).map(([method, count]) => ({ method, count })),
      recentFailures: failed.slice(0, 15).map(o => ({
        id: o.id, orderNumber: o.orderNumber, total: Number(o.total || 0),
        paymentMethod: o.paymentMethod, createdAt: o.createdAt,
        customer: o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Guest',
        email: o.user?.email || '',
      })),
    };
  }

  /**
   * Loyalty program health
   */
  async getLoyaltyHealth() {
    const [walletAgg, walletCount, customerCount, txnsAgg, recent] = await Promise.all([
      this.prisma.loyaltyWallet.aggregate({
        _sum: { balanceAed: true, totalEarnedAed: true, totalRedeemedAed: true },
      }),
      this.prisma.loyaltyWallet.count(),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.loyaltyTransaction.groupBy({
        by: ['type'],
        _sum: { amountAed: true },
        _count: { id: true },
      }),
      this.prisma.loyaltyWallet.findMany({
        orderBy: { totalEarnedAed: 'desc' },
        take: 10,
        select: { balanceAed: true, totalEarnedAed: true, totalRedeemedAed: true, user: { select: { firstName: true, lastName: true, email: true } } },
      }),
    ]);

    const earned = Number(walletAgg._sum.totalEarnedAed || 0);
    const redeemed = Number(walletAgg._sum.totalRedeemedAed || 0);

    return {
      totalWallets: walletCount,
      enrollmentRatePercent: customerCount > 0 ? Math.round((walletCount / customerCount) * 1000) / 10 : 0,
      totalBalanceInCirculation: Math.round(Number(walletAgg._sum.balanceAed || 0) * 100) / 100,
      totalEverEarned: Math.round(earned * 100) / 100,
      totalEverRedeemed: Math.round(redeemed * 100) / 100,
      redemptionRatePercent: earned > 0 ? Math.round((redeemed / earned) * 1000) / 10 : 0,
      transactionsByType: txnsAgg.map(t => ({ type: t.type, count: t._count.id, amount: Math.round(Number(t._sum.amountAed || 0) * 100) / 100 })),
      topEarners: recent.map(r => ({
        name: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Unknown',
        email: r.user?.email || '',
        balance: Number(r.balanceAed),
        totalEarned: Number(r.totalEarnedAed),
        totalRedeemed: Number(r.totalRedeemedAed),
      })),
    };
  }

  /**
   * Signup → first purchase funnel
   */
  async getSignupFunnel(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const signups = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER', createdAt: { gte: since } },
      select: { id: true, createdAt: true },
    });

    const userIds = signups.map(s => s.id);
    const firstOrders = userIds.length
      ? await this.prisma.order.findMany({
          where: { userId: { in: userIds }, status: { notIn: ['CANCELLED'] as any } },
          select: { userId: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        })
      : [];

    const firstOrderMap = new Map<string, Date>();
    for (const o of firstOrders) {
      if (!firstOrderMap.has(o.userId)) firstOrderMap.set(o.userId, o.createdAt);
    }

    let within1d = 0, within7d = 0, within30d = 0, ever = 0;
    const daysToFirst: number[] = [];

    for (const s of signups) {
      const first = firstOrderMap.get(s.id);
      if (!first) continue;
      ever += 1;
      const diff = (first.getTime() - s.createdAt.getTime()) / 86400000;
      daysToFirst.push(diff);
      if (diff <= 1) within1d++;
      if (diff <= 7) within7d++;
      if (diff <= 30) within30d++;
    }

    const avgDays = daysToFirst.length ? daysToFirst.reduce((a, b) => a + b, 0) / daysToFirst.length : 0;
    const total = signups.length;

    return {
      periodDays: days,
      totalSignups: total,
      converted: ever,
      conversionRatePercent: total ? Math.round((ever / total) * 1000) / 10 : 0,
      within1Day: within1d,
      within7Days: within7d,
      within30Days: within30d,
      avgDaysToFirstPurchase: Math.round(avgDays * 10) / 10,
      funnel: [
        { stage: 'Signed up', count: total },
        { stage: 'Converted within 1 day', count: within1d },
        { stage: 'Converted within 7 days', count: within7d },
        { stage: 'Converted within 30 days', count: within30d },
        { stage: 'Converted (any time)', count: ever },
      ],
    };
  }

  /**
   * Repeat purchase rate
   */
  async getRepeatPurchaseRate(days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const grouped = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since }, status: { notIn: ['CANCELLED'] as any } },
      _count: { id: true },
    });

    const buyers = grouped.length;
    const repeaters = grouped.filter(g => g._count.id > 1).length;
    const totalOrders = grouped.reduce((s, g) => s + g._count.id, 0);

    return {
      periodDays: days,
      uniqueBuyers: buyers,
      repeatBuyers: repeaters,
      oneTimeBuyers: buyers - repeaters,
      repeatRatePercent: buyers ? Math.round((repeaters / buyers) * 1000) / 10 : 0,
      avgOrdersPerBuyer: buyers ? Math.round((totalOrders / buyers) * 100) / 100 : 0,
    };
  }

  /**
   * Bulk order request analytics (B2B pipeline)
   */
  async getBulkOrderReport(days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [byStatus, recent, totalCount] = await Promise.all([
      this.prisma.bulkOrderRequest.groupBy({
        by: ['status'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
      this.prisma.bulkOrderRequest.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { id: true, name: true, email: true, status: true, createdAt: true, items: { select: { quantity: true } } },
      }),
      this.prisma.bulkOrderRequest.count({ where: { createdAt: { gte: since } } }),
    ]);

    return {
      periodDays: days,
      total: totalCount,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
      recent: recent.map(r => ({
        id: r.id, name: r.name, email: r.email, status: r.status,
        createdAt: r.createdAt,
        totalQuantity: r.items.reduce((s, i) => s + i.quantity, 0),
        lineCount: r.items.length,
      })),
    };
  }

  /**
   * Invoice activity
   */
  async getInvoiceReport(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [agg, byStatus, withoutPdf] = await Promise.all([
      this.prisma.invoices.aggregate({
        where: { issuedAt: { gte: since } },
        _sum: { totalInclVat: true, vatAmount: true },
        _count: true,
      }),
      this.prisma.invoices.groupBy({
        by: ['status'],
        where: { issuedAt: { gte: since } },
        _count: { id: true },
      }),
      this.prisma.invoices.count({ where: { issuedAt: { gte: since }, OR: [{ pdfUrl: null }, { pdfUrl: '' }] } }),
    ]);

    return {
      periodDays: days,
      issuedCount: agg._count,
      totalInvoicedInclVat: Math.round(Number(agg._sum.totalInclVat || 0) * 100) / 100,
      totalVatInvoiced: Math.round(Number(agg._sum.vatAmount || 0) * 100) / 100,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
      missingPdfCount: withoutPdf,
    };
  }

  /**
   * Daily order pipeline — orders moving through statuses
   */
  async getOrderPipeline(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    });

    const byDay = new Map<string, Record<string, number>>();
    for (const o of orders) {
      const k = o.createdAt.toISOString().slice(0, 10);
      const e = byDay.get(k) || {};
      e[o.status] = (e[o.status] || 0) + 1;
      byDay.set(k, e);
    }

    const series: any[] = [];
    const cursor = new Date(since);
    const today = new Date();
    while (cursor <= today) {
      const k = cursor.toISOString().slice(0, 10);
      const e = byDay.get(k) || {};
      series.push({ date: k, ...e });
      cursor.setDate(cursor.getDate() + 1);
    }
    return series;
  }

  /**
   * Featured / new / best-seller products performance
   */
  async getFeaturedPerformance(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const items = await this.prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since }, status: { notIn: ['CANCELLED', 'REFUNDED'] as any } } },
      select: { quantity: true, subtotal: true, productId: true },
    });

    const productIds = [...new Set(items.map(i => i.productId).filter((x): x is number => x !== null))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, isFeatured: true, isNew: true, isBestSeller: true },
    });
    const flagMap = new Map(products.map(p => [p.id, p]));

    const tally = (key: 'isFeatured' | 'isNew' | 'isBestSeller') => {
      let revenue = 0, qty = 0;
      for (const item of items) {
        if (!item.productId) continue;
        if (flagMap.get(item.productId)?.[key]) {
          revenue += Number(item.subtotal || 0);
          qty += item.quantity;
        }
      }
      return { revenue: Math.round(revenue * 100) / 100, qty };
    };

    const totalRev = items.reduce((s, i) => s + Number(i.subtotal || 0), 0);
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);

    const featured = tally('isFeatured');
    const isNew = tally('isNew');
    const bestSeller = tally('isBestSeller');

    return {
      periodDays: days,
      totalRevenue: Math.round(totalRev * 100) / 100,
      totalQty,
      featured: { ...featured, sharePercent: totalRev ? Math.round((featured.revenue / totalRev) * 1000) / 10 : 0 },
      isNew: { ...isNew, sharePercent: totalRev ? Math.round((isNew.revenue / totalRev) * 1000) / 10 : 0 },
      bestSeller: { ...bestSeller, sharePercent: totalRev ? Math.round((bestSeller.revenue / totalRev) * 1000) / 10 : 0 },
    };
  }

  /**
   * Full BI report bundle — returns everything in one call
   */
  async getFullReport(days = 30) {
    const [
      financial,
      revenueSeries,
      orderBreakdown,
      topProducts,
      stock,
      customers,
      vat,
      categoryPerformance,
      promos,
      // -- new --
      refunds,
      inventoryValue,
      catalogHealth,
      slowMovers,
      returnsByProduct,
      revenueByBrand,
      subcategoryPerformance,
      fulfillment,
      stuckOrders,
      abandonedCarts,
      failedPayments,
      loyalty,
      signupFunnel,
      repeatRate,
      bulkOrders,
      invoices,
      orderPipeline,
      featuredPerformance,
    ] = await Promise.all([
      this.getFinancialSummary(),
      this.getRevenueTimeSeries(days),
      this.getOrderBreakdown(),
      this.getTopProducts(10),
      this.getStockReport(),
      this.getCustomerAnalytics(days),
      this.getVatReport(days),
      this.getCategoryPerformance(),
      this.getPromoReport(),
      this.getRefundReport(days),
      this.getInventoryValuation(),
      this.getCatalogHealth(),
      this.getSlowMovers(Math.max(days, 60)),
      this.getReturnsByProduct(days),
      this.getRevenueByBrand(days),
      this.getSubcategoryPerformance(days),
      this.getFulfillmentSLA(days),
      this.getStuckOrders(),
      this.getAbandonedCarts(7),
      this.getFailedPayments(days),
      this.getLoyaltyHealth(),
      this.getSignupFunnel(days),
      this.getRepeatPurchaseRate(days),
      this.getBulkOrderReport(Math.max(days, 60)),
      this.getInvoiceReport(days),
      this.getOrderPipeline(days),
      this.getFeaturedPerformance(days),
    ]);

    return {
      financial,
      revenueSeries,
      orderBreakdown,
      topProducts,
      stock,
      customers,
      vat,
      categoryPerformance,
      promos,
      refunds,
      inventoryValue,
      catalogHealth,
      slowMovers,
      returnsByProduct,
      revenueByBrand,
      subcategoryPerformance,
      fulfillment,
      stuckOrders,
      abandonedCarts,
      failedPayments,
      loyalty,
      signupFunnel,
      repeatRate,
      bulkOrders,
      invoices,
      orderPipeline,
      featuredPerformance,
    };
  }
}
