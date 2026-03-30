export class DashboardStatsDto {
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  totalCustomers: number;
  newCustomersToday: number;
  topProducts: TopProductDto[];
  lowStockProducts: LowStockProductDto[];
  activeBanners: number;
  totalBanners: number;
  recentOrders: RecentOrderDto[];
  ordersByStatus: OrderStatusCount[];
  catalogSummary?: CatalogSummaryDto;
  recentActivity?: RecentActivityDto[];
}

export class TopProductDto {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  totalOrders: number;
  totalRevenue: number;
  totalQuantity: number;
}

export class LowStockProductDto {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  stock: number;
  threshold: number;
}

export class RecentOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: Date;
}

export class OrderStatusCount {
  status: string;
  count: number;
  percentage: number;
}

export class CatalogSummaryDto {
  totalCategories: number;
  totalBrands: number;
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  lowStockCount: number;
}

export class RecentActivityDto {
  id: string;
  type: 'order' | 'product' | 'category' | 'user';
  action: 'created' | 'updated' | 'deleted';
  title: string;
  subtitle?: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}
