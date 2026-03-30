// ── Auth ──
export interface UserDto {
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
}

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserDto;
  tokens: TokensDto;
}

// ── Products ──
export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
  media_asset_id?: string;
}

export interface ProductDto {
  id: string;
  sku?: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  fullDescription?: string;
  price: number;
  oldPrice?: number;
  compareAtPrice?: number;
  costPrice?: number;
  priceInclVat?: number;
  imageUrl?: string;
  images?: ProductImage[];
  category?: CategoryDto;
  categoryId?: string;
  subcategory?: CategoryDto;
  brand?: BrandDto;
  brandId?: string;
  stock?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  inStock?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  status?: string;
  discount?: number;
  specifications?: Array<{ key: string; value: string }> | Record<string, string>;
  features?: string[];
  highlights?: string[];
  galleryImageUrls?: string[];
  deliveryNote?: string;
  returnsNote?: string;
  urlSlug?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Categories ──
export interface CategoryDto {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  parentId?: string;
  children?: CategoryDto[];
  subcategories?: CategoryDto[];
  productCount?: number;
}

// ── Brands ──
export interface BrandDto {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
  productCount?: number;
}

// ── Cart ──
export interface CartItemDto {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  product?: ProductDto;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  total: number;
}

// ── Favorites ──
export interface FavoriteDto {
  productId: string;
  product?: ProductDto;
}

// ── Orders ──
export interface OrderDto {
  id: string;
  orderNumber?: string;
  status: string;
  total: number;
  subtotal: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  items: OrderItemDto[];
  shippingAddress?: AddressDto;
  createdAt: string;
  updatedAt?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

// ── Addresses ──
export interface AddressDto {
  id: string;
  label?: string;
  firstName: string;
  lastName: string;
  email?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── Content / CMS ──
export interface BannerDto {
  id: string;
  placement: string;
  position?: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
  imageDesktopUrl?: string;
  imageMobileUrl?: string;
  linkUrl?: string;
  startAt?: string;
  endAt?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface LandingSectionDto {
  id: string;
  landingPageId?: string;
  type: string;
  title?: string;
  subtitle?: string;
  data?: Record<string, unknown>;
  config?: Record<string, unknown>;
  displayOrder: number;
  isActive: boolean;
}

export interface LandingPageDto {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  isActive: boolean;
  sections: LandingSectionDto[];
}

export interface HomePageDto {
  sections: LandingSectionDto[];
}

// ── Admin ──
export interface DashboardStatsDto {
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  totalOrders?: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  totalRevenue?: number;
  totalCustomers: number;
  newCustomersToday: number;
  totalProducts?: number;
  topProducts: Array<{ id: string; name: string; count: number }>;
  lowStockProducts: Array<{ id: string; name: string; stock: number }>;
  recentOrders: OrderDto[];
  ordersByStatus: Array<{ status: string; count: number }>;
}

// ── Account ──
export interface LoyaltyDto {
  balanceAed: number;
  totalEarnedAed: number;
  totalRedeemedAed: number;
  // Aliases used by some pages
  totalEarned?: number;
  totalRedeemed?: number;
  transactions: LoyaltyTransactionDto[];
}

export interface LoyaltyTransactionDto {
  id: string;
  type: 'EARNED' | 'REDEEMED' | 'ADJUSTMENT';
  amountAed: number;
  description?: string;
  orderId?: string;
  createdAt: string;
}

export interface PaymentMethodDto {
  id: string;
  type: string;
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}
