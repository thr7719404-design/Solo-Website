import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Revenue over time — daily aggregation for a date range
   */
  async getRevenueTimeSeries(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
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
    const variants = await this.prisma.product_variants.findMany({
      where: { is_active: true },
      select: {
        id: true,
        product_id: true,
        stock_qty: true,
        sku: true,
        products: { select: { id: true, productName: true, sku: true, isActive: true } },
      },
      orderBy: { stock_qty: 'asc' },
    });

    const lowStock = variants.filter(v => v.stock_qty <= 5 && v.stock_qty > 0);
    const outOfStock = variants.filter(v => v.stock_qty <= 0);
    const healthy = variants.filter(v => v.stock_qty > 5);

    // Stock distribution buckets
    const distribution = [
      { label: 'Out of Stock (0)', count: outOfStock.length },
      { label: 'Critical (1-5)', count: lowStock.length },
      { label: 'Low (6-20)', count: variants.filter(v => v.stock_qty > 5 && v.stock_qty <= 20).length },
      { label: 'Normal (21-100)', count: variants.filter(v => v.stock_qty > 20 && v.stock_qty <= 100).length },
      { label: 'High (100+)', count: variants.filter(v => v.stock_qty > 100).length },
    ];

    const totalStockValue = variants.reduce((sum, v) => sum + v.stock_qty, 0);

    return {
      totalVariants: variants.length,
      totalStockUnits: totalStockValue,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      healthyCount: healthy.length,
      distribution,
      lowStockItems: [...outOfStock, ...lowStock].slice(0, 20).map(v => ({
        variantId: v.id,
        productId: v.product_id,
        productName: v.products.productName,
        sku: v.sku || v.products.sku,
        stockQty: v.stock_qty,
        isActive: v.products.isActive,
      })),
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

    return {
      periodDays: days,
      totalVatCollected: Math.round(totalVat * 100) / 100,
      totalRevenue: Math.round(totalRev * 100) / 100,
      effectiveRate: totalRev > 0 ? Math.round((totalVat / totalRev) * 10000) / 100 : 0,
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
      orderCount: promoMap.get(p.code)?.orderCount || 0,
      totalRevenue: Math.round((promoMap.get(p.code)?.totalRevenue || 0) * 100) / 100,
      totalDiscount: Math.round((promoMap.get(p.code)?.totalDiscount || 0) * 100) / 100,
    }));
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
    };
  }
}
