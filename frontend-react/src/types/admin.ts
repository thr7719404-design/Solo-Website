// ============================================================================
// Admin Types — Dashboard, Orders, Customers, Reports
// Matches NestJS backend /admin/*
// ============================================================================

export interface DashboardStatsDto {
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

export interface CatalogSummaryDto {
  totalCategories: number;
  totalBrands: number;
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  lowStockCount: number;
}

export interface RecentActivityDto {
  id: string;
  type: 'order' | 'product' | 'category' | 'user';
  action: 'created' | 'updated' | 'deleted';
  title: string;
  subtitle?: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface TopProductDto {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  totalOrders: number;
  totalRevenue: number;
  totalQuantity: number;
}

export interface LowStockProductDto {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  stock: number;
  threshold: number;
}

export interface RecentOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface OrderStatusCount {
  status: string;
  count: number;
  percentage: number;
}

// -- Customer DTOs ------------------------------------------------------------

export interface CustomerDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  orderCount?: number;
  totalSpent?: number;
}

export interface CustomerDetailsDto extends CustomerDto {
  addresses: CustomerAddressDto[];
  orders: CustomerOrderSummaryDto[];
}

export interface CustomerAddressDto {
  id: string;
  label?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface CustomerOrderSummaryDto {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface CreateCustomerRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateCustomerRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

// -- Admin Order management ---------------------------------------------------

export interface AdminOrderListParams {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
  notes?: string;
  trackingNumber?: string;
}
