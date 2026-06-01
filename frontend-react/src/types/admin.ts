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
  status?: 'ACTIVE' | 'UNVERIFIED' | 'INACTIVE';
  createdAt?: string;
  lastLoginAt?: string;
  orderCount?: number;
  totalSpent?: number;
  loyaltyBalanceAed?: number;
  defaultCity?: string | null;
  lastOrderAt?: string | null;
  addressesCount?: number;
}

export interface CustomerDetailsDto extends CustomerDto {
  addresses: CustomerAddressDto[];
  orders: CustomerOrderSummaryDto[];
  loyalty?: {
    balanceAed: number;
    pendingBalanceAed: number;
    totalEarnedAed: number;
    totalRedeemedAed: number;
  };
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

// -- Reports DTOs (from /admin/reports) --------------------------------------

export interface FinancialPeriod {
  revenue: number;
  orders: number;
  vat: number;
  discount: number;
  shipping?: number;
}

export interface FinancialSummaryDto {
  today: FinancialPeriod;
  week: FinancialPeriod;
  month: FinancialPeriod;
  allTime: FinancialPeriod & { shipping: number };
  monthGrowthPercent: number;
  avgOrderValue: number;
  totalOrders: number;
  totalCustomers: number;
}

export interface RevenueDayDto {
  date: string;
  revenue: number;
  orders: number;
  vat: number;
  discount: number;
  shipping: number;
}

export interface BreakdownItem {
  label: string;
  count: number;
  revenue: number;
}

export interface OrderBreakdownDto {
  byStatus: BreakdownItem[];
  byPayment: BreakdownItem[];
  byShipping: BreakdownItem[];
}

export interface ReportTopProduct {
  productId: number | null;
  name: string;
  sku: string;
  totalRevenue: number;
  totalQty: number;
  totalOrders: number;
}

export interface StockDistBucket {
  label: string;
  count: number;
}

export interface LowStockVariant {
  variantId: number | null;
  productId: number;
  productName: string;
  sku: string;
  stockQty: number;
  isActive: boolean;
}

export interface StockReportDto {
  totalVariants: number;
  totalStockUnits: number;
  outOfStockCount: number;
  lowStockCount: number;
  healthyCount: number;
  distribution: StockDistBucket[];
  lowStockItems: LowStockVariant[];
}

export interface CustomerGrowthDay {
  date: string;
  newCustomers: number;
  cumulative: number;
}

export interface TopSpender {
  userId: string;
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
}

export interface CustomerAnalyticsDto {
  totalCustomers: number;
  newCustomersToday: number;
  growthSeries: CustomerGrowthDay[];
  topSpenders: TopSpender[];
  segments: { firstTime: number; returning: number };
}

export interface VatMonthEntry {
  month: string;
  vatCollected: number;
  totalRevenue: number;
  orderCount: number;
}

export interface VatReportDto {
  periodDays: number;
  totalVatCollected: number;
  totalRevenue: number;
  effectiveRate: number;
  monthlySeries: VatMonthEntry[];
}

export interface CategoryPerfItem {
  categoryId: number;
  name: string;
  revenue: number;
  qty: number;
  orders: number;
}

export interface PromoReportItem {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  usageCount: number;
  usageLimit: number | null;
  isActive: boolean;
  orderCount: number;
  totalRevenue: number;
  totalDiscount: number;
}

export interface FullReportDto {
  financial: FinancialSummaryDto;
  revenueSeries: RevenueDayDto[];
  orderBreakdown: OrderBreakdownDto;
  topProducts: ReportTopProduct[];
  stock: StockReportDto;
  customers: CustomerAnalyticsDto;
  vat: VatReportDto;
  categoryPerformance: CategoryPerfItem[];
  promos: PromoReportItem[];
  // -- extended holistic reports --
  refunds: RefundReportDto;
  inventoryValue: InventoryValuationDto;
  catalogHealth: CatalogHealthDto;
  slowMovers: SlowMoversDto;
  returnsByProduct: ReturnsByProductItem[];
  revenueByBrand: BrandRevenueItem[];
  subcategoryPerformance: SubcategoryPerfItem[];
  fulfillment: FulfillmentSLADto;
  stuckOrders: StuckOrdersDto;
  abandonedCarts: AbandonedCartsDto;
  failedPayments: FailedPaymentsDto;
  loyalty: LoyaltyHealthDto;
  signupFunnel: SignupFunnelDto;
  repeatRate: RepeatRateDto;
  bulkOrders: BulkOrderReportDto;
  invoices: InvoiceReportDto;
  orderPipeline: OrderPipelineDay[];
  featuredPerformance: FeaturedPerformanceDto;
}

// ---------------- Extended report DTOs ---------------------------------------

export interface RefundReasonItem { reason: string; count: number; amount: number; }
export interface RefundStatusItem { status: string; count: number; amount: number; }
export interface RefundDayItem { date: string; count: number; amount: number; }
export interface RefundReportDto {
  periodDays: number;
  totalReturns: number;
  totalRefundAmount: number;
  refundRatePercent: number;
  avgProcessingDays: number;
  refundedOrdersCount: number;
  refundedOrdersValue: number;
  byReason: RefundReasonItem[];
  byStatus: RefundStatusItem[];
  series: RefundDayItem[];
}

export interface InventoryGroupItem { name: string; cost: number; retail: number; units: number; }
export interface InventoryTopItem { productId: number; name: string; sku: string; stockQty: number; costValue: number; retailValue: number; }
export interface InventoryValuationDto {
  totalUnits: number;
  totalCostValue: number;
  totalRetailValue: number;
  potentialMargin: number;
  productCount: number;
  byCategory: InventoryGroupItem[];
  byBrand: InventoryGroupItem[];
  topByValue: InventoryTopItem[];
}

export interface CatalogHealthIssues {
  missingImages: number;
  missingDescription: number;
  missingShortDescription: number;
  missingPricing: number;
  missingMetaTitle: number;
  missingMetaDescription: number;
  missingBrand: number;
  missingCategory: number;
}
export interface CatalogHealthDto {
  total: number;
  active: number;
  inactive: number;
  discontinued: number;
  featured: number;
  isNew: number;
  bestSeller: number;
  issues: CatalogHealthIssues;
  missingImagesSample: { id: number; productName: string; sku: string; isActive: boolean }[];
  completenessScore: number;
}

export interface SlowMoverItem {
  productId: number;
  name: string;
  sku: string;
  stockQty: number;
  category: string | null;
  brand: string | null;
  retailValue: number;
  ageDays: number;
}
export interface SlowMoversDto {
  periodDays: number;
  slowMoverCount: number;
  tiedUpValue: number;
  items: SlowMoverItem[];
}

export interface ReturnsByProductItem {
  productId: number | null;
  name: string;
  sku: string;
  returnCount: number;
  returnedQty: number;
  soldQty: number;
  returnRatePercent: number;
  refundedAmount: number;
}

export interface BrandRevenueItem {
  brandId: number;
  name: string;
  revenue: number;
  qty: number;
}

export interface SubcategoryPerfItem {
  subcategoryId: number;
  name: string;
  category: string;
  revenue: number;
  qty: number;
}

export interface FulfillmentSLADto {
  periodDays: number;
  ordersAnalyzed: number;
  shippedCount: number;
  deliveredCount: number;
  avgOrderToShipDays: number;
  medianOrderToShipDays: number;
  avgShipToDeliverDays: number;
  medianShipToDeliverDays: number;
  avgEndToEndDays: number;
  shippedWithin24h: number;
  shippedWithin48h: number;
}

export interface StuckOrderItem {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  ageDays: number;
  createdAt: string;
  customerName: string;
  customerEmail: string;
}
export interface StuckOrdersDto {
  totalStuck: number;
  over3DaysCount: number;
  over7DaysCount: number;
  over14DaysCount: number;
  items: StuckOrderItem[];
}

export interface AbandonedCartItem {
  id: string;
  userId: string | null;
  isGuest: boolean;
  customerName: string;
  email: string;
  itemCount: number;
  estimatedValue: number;
  ageHours: number;
}
export interface AbandonedCartsDto {
  periodDays: number;
  abandonedCartCount: number;
  totalLostValue: number;
  avgCartValue: number;
  totalItemsAbandoned: number;
  guestCarts: number;
  registeredCarts: number;
  topCarts: AbandonedCartItem[];
}

export interface FailedPaymentItem {
  id: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  customer: string;
  email: string;
}
export interface FailedPaymentsDto {
  periodDays: number;
  failedCount: number;
  failureRatePercent: number;
  totalLostRevenue: number;
  byMethod: { method: string; count: number }[];
  recentFailures: FailedPaymentItem[];
}

export interface LoyaltyTopEarner {
  name: string;
  email: string;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
}
export interface LoyaltyHealthDto {
  totalWallets: number;
  enrollmentRatePercent: number;
  totalBalanceInCirculation: number;
  totalEverEarned: number;
  totalEverRedeemed: number;
  redemptionRatePercent: number;
  transactionsByType: { type: string; count: number; amount: number }[];
  topEarners: LoyaltyTopEarner[];
}

export interface SignupFunnelDto {
  periodDays: number;
  totalSignups: number;
  converted: number;
  conversionRatePercent: number;
  within1Day: number;
  within7Days: number;
  within30Days: number;
  avgDaysToFirstPurchase: number;
  funnel: { stage: string; count: number }[];
}

export interface RepeatRateDto {
  periodDays: number;
  uniqueBuyers: number;
  repeatBuyers: number;
  oneTimeBuyers: number;
  repeatRatePercent: number;
  avgOrdersPerBuyer: number;
}

export interface BulkOrderRecentItem {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  totalQuantity: number;
  lineCount: number;
}
export interface BulkOrderReportDto {
  periodDays: number;
  total: number;
  byStatus: { status: string; count: number }[];
  recent: BulkOrderRecentItem[];
}

export interface InvoiceReportDto {
  periodDays: number;
  issuedCount: number;
  totalInvoicedInclVat: number;
  totalVatInvoiced: number;
  byStatus: { status: string; count: number }[];
  missingPdfCount: number;
}

export interface OrderPipelineDay {
  date: string;
  [status: string]: string | number;
}

export interface FeaturedPerformanceBucket { revenue: number; qty: number; sharePercent: number; }
export interface FeaturedPerformanceDto {
  periodDays: number;
  totalRevenue: number;
  totalQty: number;
  featured: FeaturedPerformanceBucket;
  isNew: FeaturedPerformanceBucket;
  bestSeller: FeaturedPerformanceBucket;
}
