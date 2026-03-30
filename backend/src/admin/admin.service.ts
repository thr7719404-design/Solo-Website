import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto, TopProductDto, LowStockProductDto, RecentOrderDto, OrderStatusCount, CatalogSummaryDto, RecentActivityDto } from './dto/dashboard-stats.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run queries in parallel for better performance
    const [
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      totalCustomers,
      newCustomersToday,
      topProducts,
      lowStockProducts,
      bannerStats,
      recentOrders,
      ordersByStatus,
      catalogSummary,
      recentActivity,
    ] = await Promise.all([
      // Orders count
      this.prisma.order.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: weekStart } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: monthStart } },
      }),

      // Revenue aggregation
      this.prisma.order.aggregate({
        where: { 
          createdAt: { gte: todayStart },
          status: { notIn: ['CANCELLED'] },
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { 
          createdAt: { gte: weekStart },
          status: { notIn: ['CANCELLED'] },
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { 
          createdAt: { gte: monthStart },
          status: { notIn: ['CANCELLED'] },
        },
        _sum: { total: true },
      }),

      // Customers
      this.prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
      this.prisma.user.count({
        where: { 
          role: 'CUSTOMER',
          createdAt: { gte: todayStart },
        },
      }),

      // Top products (from order items)
      this.getTopProducts(5),

      // Low stock products (placeholder - would need inventory integration)
      this.getLowStockProducts(5),

      // Banner stats
      Promise.all([
        this.prisma.banner.count({ where: { isActive: true } }),
        this.prisma.banner.count(),
      ]),

      // Recent orders
      this.getRecentOrders(10),

      // Orders by status
      this.getOrdersByStatus(),

      // Catalog summary
      this.getCatalogSummary(),

      // Recent activity
      this.getRecentActivity(10),
    ]);

    return {
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      revenueToday: revenueToday._sum.total ? Number(revenueToday._sum.total) : 0,
      revenueThisWeek: revenueThisWeek._sum.total ? Number(revenueThisWeek._sum.total) : 0,
      revenueThisMonth: revenueThisMonth._sum.total ? Number(revenueThisMonth._sum.total) : 0,
      totalCustomers,
      newCustomersToday,
      topProducts,
      lowStockProducts,
      activeBanners: bannerStats[0],
      totalBanners: bannerStats[1],
      recentOrders,
      ordersByStatus,
      catalogSummary,
      recentActivity,
    };
  }

  /**
   * Get catalog summary for dashboard
   * Uses inventory schema tables (Category, Brand, Product)
   */
  private async getCatalogSummary(): Promise<CatalogSummaryDto> {
    const lowStockThreshold = 10;

    const [
      totalCategories,
      totalBrands,
      totalProducts,
      activeProducts,
      featuredProducts,
      lowStockCountResult,
    ] = await Promise.all([
      this.prisma.category.count(),
      this.prisma.brand.count(),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ where: { isFeatured: true } }),
      // Low stock count placeholder - inventory tracking not yet implemented
      Promise.resolve(0),
    ]);

    const lowStockCount = Number(lowStockCountResult ?? 0);

    return {
      totalCategories,
      totalBrands,
      totalProducts,
      activeProducts,
      featuredProducts,
      lowStockCount,
    };
  }

  /**
   * Get recent activity for dashboard
   */
  private async getRecentActivity(limit: number): Promise<RecentActivityDto[]> {
    const activities: RecentActivityDto[] = [];

    // Get recent orders
    const recentOrders = await this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    for (const order of recentOrders) {
      activities.push({
        id: order.id,
        type: 'order',
        action: 'created',
        title: `Order ${order.orderNumber}`,
        subtitle: `${order.user.firstName} ${order.user.lastName} - $${Number(order.total).toFixed(2)}`,
        timestamp: order.createdAt,
        userId: order.userId,
        userName: `${order.user.firstName} ${order.user.lastName}`,
      });
    }

    // Get recent products from inventory schema
    const recentProducts = await this.prisma.product.findMany({
      take: Math.min(5, limit),
      orderBy: { updatedAt: 'desc' },
    });

    for (const product of recentProducts) {
      activities.push({
        id: product.id.toString(),
        type: 'product',
        action: product.createdAt.getTime() === product.updatedAt.getTime() ? 'created' : 'updated',
        title: product.productName,
        subtitle: `SKU: ${product.sku}`,
        timestamp: product.updatedAt,
      });
    }

    // Get recent users
    const recentUsers = await this.prisma.user.findMany({
      take: Math.min(5, limit),
      orderBy: { createdAt: 'desc' },
      where: { role: 'CUSTOMER' },
    });

    for (const user of recentUsers) {
      activities.push({
        id: user.id,
        type: 'user',
        action: 'created',
        title: `${user.firstName} ${user.lastName}`,
        subtitle: user.email,
        timestamp: user.createdAt,
      });
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get top selling products
   */
  private async getTopProducts(limit: number): Promise<TopProductDto[]> {
    const orderItems = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      _count: {
        orderId: true,
      },
      orderBy: {
        _sum: {
          subtotal: 'desc',
        },
      },
      take: limit,
    });

    // Fetch product details with images from inventory schema
    const productIds = orderItems
      .map(item => item.productId)
      .filter((id): id is number => id !== null);
    
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    return orderItems.map(item => {
      const product = item.productId ? productMap.get(item.productId) : null;
      return {
        id: item.productId?.toString() || '',
        sku: product?.sku || 'N/A',
        name: product?.productName || 'Unknown Product',
        imageUrl: product?.images[0]?.media_asset_id || '',
        totalOrders: item._count.orderId,
        totalRevenue: Number(item._sum.subtotal || 0),
        totalQuantity: item._sum.quantity || 0,
      };
    });
  }

  /**
   * Get low stock products based on product stock_quantity field
   */
  private async getLowStockProducts(limit: number): Promise<LowStockProductDto[]> {
    // Return empty list - inventory tracking not yet implemented
    return [];
  }

  /**
   * Get recent orders
   */
  private async getRecentOrders(limit: number): Promise<RecentOrderDto[]> {
    const orders = await this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt,
    }));
  }

  /**
   * Get order counts by status
   */
  private async getOrdersByStatus(): Promise<OrderStatusCount[]> {
    const statusCounts = await this.prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const totalOrders = statusCounts.reduce((sum, item) => sum + item._count.id, 0);

    return statusCounts.map(item => ({
      status: item.status,
      count: item._count.id,
      percentage: totalOrders > 0 ? (item._count.id / totalOrders) * 100 : 0,
    }));
  }

  /**
   * Get filtered orders for admin
   */
  async getOrders(filters: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { status, page = 1, limit = 20, search } = filters;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: {
          id: order.user.id,
          email: order.user.email,
          name: `${order.user.firstName} ${order.user.lastName}`,
        },
        status: order.status,
        paymentStatus: order.paymentStatus,
        itemCount: order._count.items,
        total: Number(order.total),
        createdAt: order.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get order details by ID for admin
   */
  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return null;
    }

    // Fetch product details from inventory schema
    const productIds = order.items
      .map(item => item.productId)
      .filter((id): id is number => id !== null);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Resolve media_asset_id UUIDs to actual image URLs
    const mediaAssetIds = products
      .flatMap(p => p.images?.map((img: any) => img.media_asset_id) || [])
      .filter((id: string) => id);

    const mediaAssets = mediaAssetIds.length > 0
      ? await this.prisma.media_assets.findMany({
          where: { id: { in: mediaAssetIds } },
          select: { id: true, key: true },
        })
      : [];

    const mediaMap = new Map(mediaAssets.map((m: any) => [m.id, `http://localhost:3000/uploads/${m.key}`]));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      vat: Number(order.vat),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      loyaltyRedeemAed: order.loyaltyRedeemAed ? Number(order.loyaltyRedeemAed) : 0,
      loyaltyEarnAed: order.loyaltyEarnAed ? Number(order.loyaltyEarnAed) : 0,
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
      customer: {
        id: order.user.id,
        email: order.user.email,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        phone: order.user.phone,
      },
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      items: order.items.map(item => {
        const product = item.productId ? productMap.get(item.productId) : null;
        return {
          id: item.id,
          productId: item.productId,
          sku: product?.sku || 'N/A',
          name: product?.productName || 'Unknown Product',
          imageUrl: product?.images[0]?.media_asset_id ? (mediaMap.get(product.images[0].media_asset_id) || '') : '',
          quantity: item.quantity,
          unitPrice: Number(item.price),
          subtotal: Number(item.subtotal),
        };
      }),
      statusHistory: order.statusHistory,
    };
  }

  /**
   * Update order status with history tracking
   */
  async updateOrderStatus(orderId: string, data: {
    status: any;
    notes?: string;
    trackingNumber?: string;
  }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return null;

    const updateData: any = {
      status: data.status,
      updatedAt: new Date(),
    };

    // Auto-set timestamps based on status transitions
    if (data.status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    } else if (data.status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    } else if (data.status === 'PAID') {
      updateData.paymentStatus = 'PAID';
      updateData.paidAt = new Date();
    }

    if (data.trackingNumber) {
      updateData.trackingNumber = data.trackingNumber;
    }

    // Build notes
    let historyNotes = `Status changed to ${data.status}`;
    if (data.notes) {
      historyNotes += ` - ${data.notes}`;
    }
    if (data.trackingNumber) {
      historyNotes += ` - Tracking: ${data.trackingNumber}`;
    }

    // Update order + create history entry in a transaction
    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: updateData,
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: data.status,
          notes: historyNotes,
          createdBy: 'admin',
        },
      }),
    ]);

    return {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      trackingNumber: updatedOrder.trackingNumber,
      updatedAt: updatedOrder.updatedAt,
    };
  }
}
