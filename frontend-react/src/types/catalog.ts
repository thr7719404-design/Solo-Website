// ============================================================================
// Catalog Types — Products, Categories, Brands
// Matches NestJS backend /products/*, /categories/*, /brands/*
// ============================================================================

// -- Product ------------------------------------------------------------------

export interface ProductImageDto {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductSpecificationDto {
  id: string;
  key: string;
  value: string;
  unit?: string;
  displayOrder: number;
}

export interface ProductDimensionsDto {
  length?: number;
  width?: number;
  height?: number;
  diameter?: number;
  capacity?: number;
  weight?: number;
  unit?: string;
}

export interface ProductPackagingDto {
  type?: string;
  colliSize?: number;
  colliWeight?: number;
  colliLength?: number;
  colliWidth?: number;
  colliHeight?: number;
}

export interface ProductSeoDto {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface ProductOverrideDto {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  salePrice?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
  homepageRank?: number;
  categoryRank?: number;
  images?: ProductImageDto[];
  seo?: ProductSeoDto;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  listPrice?: number;
  salePrice?: number;
  oldPrice?: number;
  compareAtPrice?: number;
  priceInclVat?: number;
  currency: string;
  imageUrl: string;
  images: ProductImageDto[];
  category?: CategoryDto;
  subcategory?: SubcategoryRefDto;
  brand?: BrandDto;
  stock: number;
  inStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  discount?: number;
  homepageRank?: number;
  categoryRank?: number;
  specifications: ProductSpecificationDto[];
  features: string[];
  dimensions?: ProductDimensionsDto;
  packaging?: ProductPackagingDto;
  _override?: ProductOverrideDto;
  seo?: ProductSeoDto;
  // Product Page Fields v1
  shortDescription?: string;
  fullDescription?: string;
  highlights: string[];
  galleryImageUrls: string[];
  specs: Array<{ key: string; value: string }>;
  deliveryNote?: string;
  returnsNote?: string;
  urlSlug?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubcategoryRefDto {
  id: string;
  name: string;
  slug?: string;
}

// -- Category -----------------------------------------------------------------

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  displayOrder: number;
  isActive: boolean;
  parentId?: string;
  children: CategoryDto[];
  productCount: number;
  subcategories: SubcategoryDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubcategoryDto {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
}

// -- Brand --------------------------------------------------------------------

export interface BrandDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
}

// -- Pagination ---------------------------------------------------------------

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// -- Product list query -------------------------------------------------------

export interface ProductListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock?: boolean;
  status?: string;
}

// -- View-model helpers -------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  slug?: string;
  icon: string;
  imageUrl: string;
  productCount: number;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  imageUrl?: string;
  productCount?: number;
  children: SubcategoryNode[];
}

export interface SubcategoryNode {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  productCount?: number;
}

export interface ProductSpec {
  key: string;
  value: string;
}
