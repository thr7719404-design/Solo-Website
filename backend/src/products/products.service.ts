import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ProductFilterDto, SortBy } from './dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly uploadsBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadsBaseUrl =
      this.configService.get<string>('UPLOAD_BASE_URL') ||
      this.configService.get<string>('APP_URL', 'http://localhost:3000') + '/uploads';
  }

  /**
   * Resolve media_asset_id UUIDs on product images to actual URLs.
   * Mutates the images in-place so transformProduct picks up real URLs.
   */
  async resolveProductImageUrls(products: any[]): Promise<void> {
    const mediaIds = products
      .flatMap((p) => p.images?.map((img: any) => img.media_asset_id) || [])
      .filter(Boolean);

    if (mediaIds.length === 0) return;

    const uniqueIds = [...new Set(mediaIds)];
    const assets = await this.prisma.media_assets.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, key: true },
    });
    const urlMap = new Map(assets.map((a) => [a.id, `${this.uploadsBaseUrl}/${a.key}`]));

    for (const product of products) {
      if (!product.images) continue;
      for (const img of product.images) {
        img.media_asset_id = urlMap.get(img.media_asset_id) || img.media_asset_id;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Inventory Categories/Brands (for product form dropdowns)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get all inventory categories for product form dropdowns
   */
  async getInventoryCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });

    return categories.map(cat => ({
      id: cat.id.toString(),
      name: cat.name,
      description: cat.description,
      displayOrder: cat.sort_order,
      isActive: cat.isActive,
    }));
  }

  /**
   * Get all inventory brands for product form dropdowns
   */
  async getInventoryBrands() {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
    });

    return brands.map(brand => ({
      id: brand.id.toString(),
      name: brand.name,
      description: brand.description,
      website: brand.website,
      isActive: brand.isActive,
    }));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // findAll helpers — extracted to keep cognitive complexity under control.
  // ──────────────────────────────────────────────────────────────────────────

  private applyStatusFilter(where: any, status?: string, isActive?: string) {
    if (status === 'all') return;
    if (status === 'active') { where.isActive = true; return; }
    if (status === 'draft') { where.isActive = false; return; }
    if (status === 'out_of_stock') { where.isActive = true; where.stockQty = 0; return; }
    if (isActive === 'true') { where.isActive = true; return; }
    if (isActive === 'false') { where.isActive = false; return; }
    // Default: show only active products for public endpoints
    where.isActive = true;
  }

  private applyStockFilter(where: any, status?: string, inStock?: string) {
    // Note: OOS products are intentionally included in public listings so the
    // storefront can show the "Out of Stock" watermark and the WhatsApp
    // "Contact Seller" CTA. Callers that want only in-stock items must pass
    // inStock=true explicitly.
    if (inStock === 'true') { where.stockQty = { gt: 0 }; return; }
    if (inStock === 'false') { where.stockQty = 0; return; }
    if (status === 'all' && inStock === 'low') {
      where.stockQty = { gt: 0, lte: 10 };
    }
  }

  private collectCategoryList(product: any): Array<{ id: number; name: string }> {
    const out = new Map<number, { id: number; name: string }>();
    if (Array.isArray(product?.categories)) {
      for (const link of product.categories) {
        if (link?.category) out.set(link.category.id, { id: link.category.id, name: link.category.name });
      }
    }
    if (product?.category) {
      out.set(product.category.id, { id: product.category.id, name: product.category.name });
    }
    return Array.from(out.values());
  }

  private collectSubcategoryList(product: any): Array<{ id: number; name: string }> {
    const out = new Map<number, { id: number; name: string }>();
    if (Array.isArray(product?.subcategoriesLinks)) {
      for (const link of product.subcategoriesLinks) {
        if (link?.subcategory) out.set(link.subcategory.id, { id: link.subcategory.id, name: link.subcategory.name });
      }
    }
    if (product?.subcategory) {
      out.set(product.subcategory.id, { id: product.subcategory.id, name: product.subcategory.name });
    }
    return Array.from(out.values());
  }

  private resolveCategoryIdsFromDto(dto: any): number[] | null {
    const arr = dto?.categoryIds;
    if (!Array.isArray(arr)) return null;
    const ids = arr
      .map((x: any) => Number.parseInt(String(x), 10))
      .filter((n: number) => Number.isFinite(n));
    return Array.from(new Set(ids));
  }

  private resolveSubcategoryIdsFromDto(dto: any): number[] | null {
    const arr = dto?.subcategoryIds;
    if (!Array.isArray(arr)) return null;
    const ids = arr
      .map((x: any) => Number.parseInt(String(x), 10))
      .filter((n: number) => Number.isFinite(n));
    return Array.from(new Set(ids));
  }

  private async syncProductCategories(tx: any, productId: number, categoryIds: number[] | null) {
    if (categoryIds === null) return;
    await tx.productCategory.deleteMany({ where: { productId } });
    if (categoryIds.length === 0) return;
    await tx.productCategory.createMany({
      data: categoryIds.map((categoryId) => ({ productId, categoryId })),
      skipDuplicates: true,
    });
  }

  private async syncProductSubcategories(tx: any, productId: number, subcategoryIds: number[] | null) {
    if (subcategoryIds === null) return;
    await tx.productSubcategory.deleteMany({ where: { productId } });
    if (subcategoryIds.length === 0) return;
    await tx.productSubcategory.createMany({
      data: subcategoryIds.map((subcategoryId) => ({ productId, subcategoryId })),
      skipDuplicates: true,
    });
  }

  private async applyCategoryFilter(where: any, categoryId?: string) {
    if (!categoryId) return;
    let id: number | null = null;
    const parsed = Number.parseInt(categoryId, 10);
    if (!Number.isNaN(parsed)) {
      id = parsed;
    } else {
      const cat = await this.prisma.category.findFirst({ where: { slug: categoryId } });
      if (cat) id = cat.id;
    }
    if (id == null) return;
    // Match either the legacy primary FK or any join-table assignment
    const orClause = [
      { categoryId: id },
      { categories: { some: { categoryId: id } } },
    ];
    if (where.OR) {
      where.AND = [...(where.AND || []), { OR: orClause }];
    } else {
      where.OR = orClause;
    }
  }

  private applySubcategoryFilter(where: any, subcategoryId?: string) {
    if (!subcategoryId) return;
    const id = Number.parseInt(subcategoryId, 10);
    if (Number.isNaN(id)) return;
    const orClause = [
      { subcategoryId: id },
      { subcategoriesLinks: { some: { subcategoryId: id } } },
    ];
    if (where.OR) {
      where.AND = [...(where.AND || []), { OR: orClause }];
    } else {
      where.OR = orClause;
    }
  }

  private applyPriceFilter(where: any, minPrice?: number, maxPrice?: number) {
    if (minPrice === undefined && maxPrice === undefined) return;
    const priceFilter: any = {};
    if (minPrice !== undefined) priceFilter.gte = minPrice;
    if (maxPrice !== undefined) priceFilter.lte = maxPrice;
    where.pricing = { price_incl_vat_aed: priceFilter };
  }

  private buildProductOrderBy(sortBy: SortBy): any {
    switch (sortBy) {
      case SortBy.PRICE_LOW: return { pricing: { price_incl_vat_aed: 'asc' } };
      case SortBy.PRICE_HIGH: return { pricing: { price_incl_vat_aed: 'desc' } };
      case SortBy.NAME_ASC: return { productName: 'asc' };
      case SortBy.NAME_DESC: return { productName: 'desc' };
      default: return { createdAt: 'desc' };
    }
  }

  async findAll(filters: ProductFilterDto) {
    const {
      categoryId,
      subcategoryId,
      brandId,
      brandIds,
      minPrice,
      maxPrice,
      search,
      q,
      sortBy = SortBy.NEWEST,
      page: rawPage = 1,
      limit: rawLimit = 20,
      isFeatured,
      isNew,
      isBestSeller,
      inStock,
      status,
      isActive,
      isOnSale,
    } = filters;

    // Ensure numeric values for pagination
    const page = typeof rawPage === 'string' ? Number.parseInt(rawPage, 10) : rawPage;
    const limit = typeof rawLimit === 'string' ? Number.parseInt(rawLimit, 10) : rawLimit;

    const searchTerm = search || q;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    this.applyStatusFilter(where, status, isActive);
    this.applyStockFilter(where, status, inStock);
    await this.applyCategoryFilter(where, categoryId);

    this.applySubcategoryFilter(where, subcategoryId);
    if (brandId) where.brandId = Number.parseInt(brandId, 10);
    if (brandIds && brandIds.length > 0) {
      where.brandId = { in: brandIds.map(id => Number.parseInt(id, 10)) };
    }

    if (searchTerm) {
      where.OR = [
        { productName: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (isFeatured === 'true') where.isFeatured = true;
    if (isNew === 'true') where.isNew = true;
    if (isBestSeller === 'true') where.isBestSeller = true;
    if (isOnSale === 'true') where.product_overrides = { is_on_sale: true };

    this.applyPriceFilter(where, minPrice, maxPrice);

    const orderBy = this.buildProductOrderBy(sortBy);

    // Fetch products with pricing
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          brand: true,
          category: true,
          subcategory: true,
          categories: { include: { category: true } },
          subcategoriesLinks: { include: { subcategory: true } },
          pricing: true,
          images: {
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy,
        skip,
        take: limit,
      }) as Promise<any[]>,
      this.prisma.product.count({ where }),
    ]);

    // Resolve media asset UUIDs to actual image URLs
    await this.resolveProductImageUrls(products);

    // Transform to API format
    const transformedProducts = products.map((product: any) => ({
      id: product.id.toString(),
      sku: product.sku,
      name: product.productName,
      description: product.description,
      slug: `product-${product.id}`,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
      } : null,
      subcategory: product.subcategory ? {
        id: product.subcategory.id,
        name: product.subcategory.name,
      } : null,
      categories: this.collectCategoryList(product),
      subcategories: this.collectSubcategoryList(product),
      categoryIds: this.collectCategoryList(product).map((c: any) => String(c.id)),
      subcategoryIds: this.collectSubcategoryList(product).map((s: any) => String(s.id)),
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
      } : null,
      price: product.pricing?.price_incl_vat_aed ? Number.parseFloat(product.pricing.price_incl_vat_aed.toString()) : 0,
      listPrice: product.pricing?.price_excl_vat_aed ? Number.parseFloat(product.pricing.price_excl_vat_aed.toString()) : null,
      compareAtPrice: product.pricing?.price_excl_vat_aed ? Number.parseFloat(product.pricing.price_excl_vat_aed.toString()) : null,
      oldPrice: product.pricing?.price_excl_vat_aed ? Number.parseFloat(product.pricing.price_excl_vat_aed.toString()) : null,
      currency: 'AED',
      imageUrl: product.images?.[0]?.media_asset_id || null,
      images: product.images?.map((img: any) => ({
        id: img.id,
        url: img.media_asset_id,
        alt: img.altText || product.productName,
        displayOrder: img.displayOrder,
      })) || [],
      stock: product.stockQty ?? 0,
      inStock: (product.stockQty ?? 0) > 0,
      stockQuantity: product.stockQty ?? 0,
      material: product.material,
      color: product.colour,
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      isBestSeller: product.isBestSeller,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return {
      data: transformedProducts,
      count: products.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFeatured(limit: number = 8) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        stockQty: { gt: 0 },
      },
      include: {
        brand: true,
        category: true,
        pricing: true,
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as any[];

    await this.resolveProductImageUrls(products);

    return {
      data: products.map(product => this.transformProduct(product)),
      count: products.length,
    };
  }

  async getBestSellers(limit: number = 8) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isBestSeller: true,
        stockQty: { gt: 0 },
      },
      include: {
        brand: true,
        category: true,
        pricing: true,
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as any[];

    await this.resolveProductImageUrls(products);

    return {
      data: products.map(product => this.transformProduct(product)),
      count: products.length,
    };
  }

  async getNewArrivals(limit: number = 8) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isNew: true,
        stockQty: { gt: 0 },
      },
      include: {
        brand: true,
        category: true,
        pricing: true,
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as any[];

    await this.resolveProductImageUrls(products);

    return {
      data: products.map(product => this.transformProduct(product)),
      count: products.length,
    };
  }

  async getRelated(productIdOrSlug: string, limit: number = 6) {
    const isNumericId = /^\d+$/.test(productIdOrSlug);
    const syntheticIdMatch = /^product-(\d+)$/.exec(productIdOrSlug);
    let where: any;
    if (isNumericId) {
      where = { id: Number.parseInt(productIdOrSlug, 10) };
    } else if (syntheticIdMatch) {
      where = { id: Number.parseInt(syntheticIdMatch[1], 10) };
    } else {
      where = { OR: [{ slug: productIdOrSlug }, { sku: productIdOrSlug }] };
    }
    const product = await this.prisma.product.findFirst({
      where,
      include: {
        categories: true,
        subcategoriesLinks: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const include = {
      brand: true,
      category: true,
      pricing: true,
      images: {
        orderBy: { displayOrder: 'asc' as const },
        take: 1,
      },
    };

    // Collect all subcategory IDs from both legacy FK and join table
    const subcategoryIds = new Set<number>();
    if (product.subcategoryId) subcategoryIds.add(product.subcategoryId);
    if (Array.isArray((product as any).subcategoriesLinks)) {
      for (const link of (product as any).subcategoriesLinks) subcategoryIds.add(link.subcategoryId);
    }

    // Collect all category IDs from both legacy FK and join table
    const categoryIds = new Set<number>();
    if (product.categoryId) categoryIds.add(product.categoryId);
    if (Array.isArray((product as any).categories)) {
      for (const link of (product as any).categories) categoryIds.add(link.categoryId);
    }

    // Prefer same subcategory first; fall back to same category to fill the slots.
    let relatedProducts: any[] = [];

    if (subcategoryIds.size > 0) {
      const subIds = Array.from(subcategoryIds);
      const sameSubcategory = await this.prisma.product.findMany({
        where: {
          isActive: true,
          stockQty: { gt: 0 },
          id: { not: product.id },
          OR: [
            { subcategoryId: { in: subIds } },
            { subcategoriesLinks: { some: { subcategoryId: { in: subIds } } } },
          ],
        },
        include,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      relatedProducts = sameSubcategory as any[];
    }

    if (relatedProducts.length < limit && categoryIds.size > 0) {
      const remaining = limit - relatedProducts.length;
      const excludeIds = [product.id, ...relatedProducts.map(p => p.id)];
      const catIds = Array.from(categoryIds);
      const sameCategory = await this.prisma.product.findMany({
        where: {
          isActive: true,
          stockQty: { gt: 0 },
          id: { notIn: excludeIds },
          OR: [
            { categoryId: { in: catIds } },
            { categories: { some: { categoryId: { in: catIds } } } },
          ],
        },
        include,
        orderBy: { createdAt: 'desc' },
        take: remaining,
      });
      relatedProducts = [...relatedProducts, ...(sameCategory as any[])];
    }

    // Fallback: same brand
    if (relatedProducts.length < limit && product.brandId) {
      const remaining = limit - relatedProducts.length;
      const excludeIds = [product.id, ...relatedProducts.map(p => p.id)];
      const sameBrand = await this.prisma.product.findMany({
        where: {
          isActive: true,
          stockQty: { gt: 0 },
          id: { notIn: excludeIds },
          brandId: product.brandId,
        },
        include,
        orderBy: { createdAt: 'desc' },
        take: remaining,
      });
      relatedProducts = [...relatedProducts, ...(sameBrand as any[])];
    }

    await this.resolveProductImageUrls(relatedProducts);

    return {
      data: relatedProducts.map(p => this.transformProduct(p)),
      count: relatedProducts.length,
    };
  }

  async findOne(slugOrId: string) {
    const isNumericId = /^\d+$/.test(slugOrId);
    const syntheticIdMatch = /^product-(\d+)$/.exec(slugOrId);
    let where: any;
    if (isNumericId) {
      where = { id: Number.parseInt(slugOrId, 10) };
    } else if (syntheticIdMatch) {
      where = { id: Number.parseInt(syntheticIdMatch[1], 10) };
    } else {
      where = { OR: [{ slug: slugOrId }, { sku: slugOrId }] };
    }

    const product = await this.prisma.product.findFirst({
      where,
      include: {
        brand: true,
        category: true,
        subcategory: true,
        categories: { include: { category: true } },
        subcategoriesLinks: { include: { subcategory: true } },
        pricing: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        dimensions: true,
        packaging: true,
        specifications: true,
        productGroup: true,
      },
    }) as any;

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.resolveProductImageUrls([product]);

    let variants: any[] = [];
    if (product.productGroupId) {
      const siblings = await this.prisma.product.findMany({
        where: { productGroupId: product.productGroupId, isActive: true },
        include: {
          pricing: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        orderBy: [{ variantSortOrder: 'asc' }, { id: 'asc' }],
      }) as any[];
      await this.resolveProductImageUrls(siblings);
      variants = siblings.map((s: any) => ({
        id: s.id.toString(),
        sku: s.sku,
        slug: s.slug,
        name: s.productName,
        attributes: s.variantAttributes || {},
        price: s.pricing?.price_incl_vat_aed ? Number.parseFloat(s.pricing.price_incl_vat_aed.toString()) : 0,
        stockQty: s.stockQty ?? 0,
        inStock: (s.stockQty ?? 0) > 0,
        primaryImage: s.images?.[0]?.media_asset_id || null,
        isCurrent: s.id === product.id,
      }));
    }

    const transformed = this.transformProduct(product, true);
    if (product.productGroup) {
      transformed.productGroup = {
        id: product.productGroup.id,
        name: product.productGroup.name,
        variantAxes: product.productGroup.variantAxes || ['color'],
      };
      transformed.variants = variants;
    }
    transformed.variantAttributes = product.variantAttributes || null;
    return transformed;
  }

  private transformProduct(product: any, detailed: boolean = false): any {
    const basic = {
      id: product.id.toString(),
      sku: product.sku,
      name: product.productName,
      description: product.description,
      slug: product.slug || `product-${product.id}`,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
      } : null,
      subcategory: product.subcategory ? {
        id: product.subcategory.id,
        name: product.subcategory.name,
      } : null,
      categories: this.collectCategoryList(product),
      subcategories: this.collectSubcategoryList(product),
      categoryIds: this.collectCategoryList(product).map((c: any) => String(c.id)),
      subcategoryIds: this.collectSubcategoryList(product).map((s: any) => String(s.id)),
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
      } : null,
      price: product.pricing?.price_incl_vat_aed ? Number.parseFloat(product.pricing.price_incl_vat_aed.toString()) : 0,
      listPrice: product.pricing?.price_excl_vat_aed ? Number.parseFloat(product.pricing.price_excl_vat_aed.toString()) : null,
      compareAtPrice: product.pricing?.price_excl_vat_aed ? Number.parseFloat(product.pricing.price_excl_vat_aed.toString()) : null,
      oldPrice: product.pricing?.price_excl_vat_aed ? Number.parseFloat(product.pricing.price_excl_vat_aed.toString()) : null,
      currency: 'AED',
      imageUrl: product.images?.[0]?.media_asset_id || null,
      images: product.images?.map((img: any) => ({
        id: img.id,
        url: img.media_asset_id,
        alt: img.altText || product.productName,
        displayOrder: img.displayOrder,
      })) || [],
      stockQty: product.stockQty ?? 0,
      inStock: (product.stockQty ?? 0) > 0,
      lowStockAlert: product.lowStockAlert ?? 5,
      material: product.material,
      color: product.colour,
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      isBestSeller: product.isBestSeller,
      isActive: product.isActive,
      isDiscontinued: product.isDiscontinued ?? false,
      // Single source of truth for the catalog/admin UI. Combines isActive,
      // isDiscontinued and stockQty into one of: AVAILABLE, OUT_OF_STOCK,
      // DISCONTINUED, INACTIVE.
      availability: (() => {
        if (product.isActive === false) return 'INACTIVE';
        if (product.isDiscontinued === true) return 'DISCONTINUED';
        if ((product.stockQty ?? 0) <= 0) return 'OUT_OF_STOCK';
        return 'AVAILABLE';
      })(),
      // Legacy admin status string (kept for compatibility with the products
      // page which renders by `status`). Now derived from the same logic.
      status: (() => {
        if (product.isActive === false) return 'draft';
        if (product.isDiscontinued === true) return 'archived';
        if ((product.stockQty ?? 0) <= 0) return 'out-of-stock';
        return 'active';
      })(),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      
      // ==== NEW: Product Page Fields v1 ====
      shortDescription: product.shortDescription || null,
      fullDescription: product.fullDescription || null,
      highlights: product.highlights || [],
      specs: product.specs || [],
      deliveryNote: product.deliveryNote || null,
      returnsNote: product.returnsNote || null,
      metaTitle: product.metaTitle || null,
      metaDescription: product.metaDescription || null,
      // ==== END: Product Page Fields v1 ====
    };

    if (detailed && product.dimensions) {
      return {
        ...basic,
        dimensions: {
          length: product.dimensions.length_cm,
          width: product.dimensions.width_cm,
          height: product.dimensions.height_cm,
          diameter: product.dimensions.diameter_cm,
          capacity: product.dimensions.capacity_liter,
          weight: product.dimensions.weight_kg,
        },
        packaging: product.packaging ? {
          type: product.packaging.packagingType,
          unitsPerPack: product.packaging.units_per_pack,
          packWeightKg: product.packaging.pack_weight_kg,
        } : null,
        specifications: product.specifications?.map((spec: any) => ({
          key: spec.specKey,
          value: spec.specValue,
          unit: spec.specUnit,
        })) || [],
      };
    }

    return basic;
  }

  async create(createProductDto: any) {
    this.logger.log(`Creating new product with SKU: ${createProductDto.sku}`);
    
    try {
      // Validate required fields
      if (!createProductDto.sku) {
        throw new BadRequestException({
          message: 'SKU is required',
          code: 'VALIDATION_ERROR',
          field: 'sku',
        });
      }
      
      if (!createProductDto.name) {
        throw new BadRequestException({
          message: 'Product name is required',
          code: 'VALIDATION_ERROR',
          field: 'name',
        });
      }

      // Check if SKU already exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku: createProductDto.sku },
      });

      if (existingProduct) {
        this.logger.warn(`Product with SKU ${createProductDto.sku} already exists`);
        throw new BadRequestException({
          message: `Product with SKU "${createProductDto.sku}" already exists`,
          code: 'DUPLICATE_SKU',
          field: 'sku',
        });
      }

      // Create the product with transaction to ensure atomicity
      const product = await this.prisma.$transaction(async (tx) => {
        // Resolve many-to-many ids; legacy single FK derived from first if dto omits it
        const categoryIdsArr = this.resolveCategoryIdsFromDto(createProductDto);
        const subcategoryIdsArr = this.resolveSubcategoryIdsFromDto(createProductDto);
        const primaryCategoryId =
          (createProductDto.categoryId ? Number.parseInt(createProductDto.categoryId) : null) ??
          (categoryIdsArr && categoryIdsArr[0]) ??
          null;
        const primarySubcategoryId =
          (createProductDto.subcategoryId ? Number.parseInt(createProductDto.subcategoryId) : null) ??
          (subcategoryIdsArr && subcategoryIdsArr[0]) ??
          null;

        // Create main product record
        const newProduct = await tx.product.create({
          data: {
            sku: createProductDto.sku,
            productName: createProductDto.name,
            description: createProductDto.description,
            categoryId: primaryCategoryId,
            subcategoryId: primarySubcategoryId,
            brandId: createProductDto.brandId ? Number.parseInt(createProductDto.brandId) : null,
            designerId: createProductDto.designerId ? Number.parseInt(createProductDto.designerId) : null,
            countryId: createProductDto.countryId ? Number.parseInt(createProductDto.countryId) : null,
            material: createProductDto.material,
            colour: createProductDto.colour,
            size: createProductDto.size,
            isActive: createProductDto.isActive ?? true,
            isDiscontinued: createProductDto.isDiscontinued ?? false,
            isFeatured: createProductDto.isFeatured ?? false,
            isNew: createProductDto.isNew ?? false,
            isBestSeller: createProductDto.isBestSeller ?? false,
            // ==== NEW: Product Page Fields v1 ====
            shortDescription: createProductDto.shortDescription,
            fullDescription: createProductDto.fullDescription,
            highlights: createProductDto.highlights || [],
            specs: createProductDto.specs || [],
            deliveryNote: createProductDto.deliveryNote,
            returnsNote: createProductDto.returnsNote,
            slug: createProductDto.slug || createProductDto.urlSlug || `product-${Date.now()}`,
            metaTitle: createProductDto.metaTitle,
            metaDescription: createProductDto.metaDescription,
            // ==== END: Product Page Fields v1 ====
            stockQty: createProductDto.stock ?? 0,
          },
        });

        // Create pricing if provided
        if (createProductDto.price !== undefined) {
          await tx.productPricing.create({
            data: {
              productId: newProduct.id,
              price_incl_vat_aed: createProductDto.price,
              price_excl_vat_aed: createProductDto.compareAtPrice,
            },
          });
        }

        // Create product images (multi-image support, up to 5)
        let imageUrls: string[];
        if (createProductDto.images?.length) {
          imageUrls = createProductDto.images.slice(0, 5);
        } else if (createProductDto.imageUrl) {
          imageUrls = [createProductDto.imageUrl];
        } else {
          imageUrls = [];
        }

        if (imageUrls.length > 0) {
          await tx.productImage.createMany({
            data: imageUrls.map((url, idx) => ({
              productId: newProduct.id,
              media_asset_id: url,
              displayOrder: idx,
              isPrimary: idx === 0,
            })),
          });
        }

        // Sync many-to-many category/subcategory join tables. If the DTO omitted
        // the arrays, mirror the primary FK so reads stay consistent.
        const catSync = categoryIdsArr ?? (primaryCategoryId != null ? [primaryCategoryId] : []);
        const subSync = subcategoryIdsArr ?? (primarySubcategoryId != null ? [primarySubcategoryId] : []);
        await this.syncProductCategories(tx, newProduct.id, catSync);
        await this.syncProductSubcategories(tx, newProduct.id, subSync);

        return newProduct;
      });

      this.logger.log(`Successfully created product with ID: ${product.id}, SKU: ${product.sku}`);
      
      // Return the created product with full details
      return this.findOne(product.id.toString());
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error(`Failed to create product: ${error.message}`, error.stack);
      
      // Check for Prisma-specific errors
      if (error.code === 'P2002') {
        throw new BadRequestException({
          message: 'A product with this SKU already exists',
          code: 'DUPLICATE_SKU',
          field: 'sku',
        });
      }

      if (error.code === 'P2003') {
        throw new BadRequestException({
          message: 'Invalid reference: the specified category, brand, or other relation does not exist',
          code: 'INVALID_REFERENCE',
          details: error.meta,
        });
      }

      throw new InternalServerErrorException({
        message: 'Failed to create product. Please try again.',
        code: 'CREATE_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  private static readonly DIRECT_UPDATE_FIELDS = [
    'sku', 'material', 'colour', 'size', 'isActive', 'isDiscontinued',
    'isFeatured', 'isNew', 'isBestSeller', 'description',
    'shortDescription', 'fullDescription', 'highlights', 'specs',
    'deliveryNote', 'returnsNote', 'metaTitle', 'metaDescription',
  ];

  private static readonly RENAMED_UPDATE_FIELDS: Record<string, string> = {
    name: 'productName',
    specifications: 'specs',
    urlSlug: 'slug',
    slug: 'slug',
    stock: 'stockQty',
    stockQuantity: 'stockQty',
  };

  private static readonly FK_UPDATE_FIELDS = [
    'categoryId', 'subcategoryId', 'brandId', 'designerId', 'countryId',
  ];

  private static parseFkOrNull(value: any): number | null {
    if (!value) return null;
    return Number.parseInt(value);
  }

  private buildProductUpdateData(dto: any): any {
    const data: any = {};
    for (const f of ProductsService.DIRECT_UPDATE_FIELDS) {
      if (dto[f] !== undefined) data[f] = dto[f];
    }
    for (const [src, dest] of Object.entries(ProductsService.RENAMED_UPDATE_FIELDS)) {
      if (dto[src] !== undefined) data[dest] = dto[src];
    }
    if (dto.status !== undefined) data.isActive = dto.status === 'active';
    for (const f of ProductsService.FK_UPDATE_FIELDS) {
      if (dto[f] !== undefined) data[f] = ProductsService.parseFkOrNull(dto[f]);
    }
    return data;
  }

  private async upsertProductPricing(tx: any, productId: number, dto: any, hasExisting: boolean): Promise<void> {
    if (dto.price === undefined && dto.compareAtPrice === undefined) return;
    const pricingData: any = {};
    if (dto.price !== undefined) pricingData.price_incl_vat_aed = dto.price;
    if (dto.compareAtPrice !== undefined) pricingData.price_excl_vat_aed = dto.compareAtPrice;
    if (hasExisting) {
      await tx.productPricing.update({ where: { productId }, data: pricingData });
    } else {
      await tx.productPricing.create({
        data: {
          productId,
          price_incl_vat_aed: dto.price ?? 0,
          price_excl_vat_aed: dto.compareAtPrice ?? 0,
        },
      });
    }
  }

  private parseImagesFromDto(dto: any): Array<{ url: string; displayOrder?: number; altText?: string }> | undefined {
    if (dto.images?.length) {
      return dto.images.slice(0, 5).map((img: any, idx: number) => {
        if (typeof img === 'string') return { url: img, displayOrder: idx };
        return { url: img.url, displayOrder: img.displayOrder ?? idx, altText: img.altText };
      });
    }
    if (dto.imageUrl !== undefined) {
      return dto.imageUrl ? [{ url: dto.imageUrl, displayOrder: 0 }] : [];
    }
    return undefined;
  }

  private async replaceProductImages(tx: any, productId: number, parsedImages: Array<{ url: string; displayOrder?: number; altText?: string }>): Promise<void> {
    await tx.productImage.deleteMany({ where: { productId } });
    if (parsedImages.length > 0) {
      await tx.productImage.createMany({
        data: parsedImages.map((img, idx) => ({
          productId,
          media_asset_id: img.url,
          displayOrder: img.displayOrder ?? idx,
          isPrimary: idx === 0,
        })),
      });
    }
  }

  private mapProductUpdateError(error: any, productId: number): never {
    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error;
    }
    this.logger.error(`Failed to update product ${productId}: ${error.message}`, error.stack);
    if (error.code === 'P2002') {
      throw new BadRequestException({
        message: 'A product with this SKU already exists',
        code: 'DUPLICATE_SKU',
        field: 'sku',
      });
    }
    if (error.code === 'P2003') {
      throw new BadRequestException({
        message: 'Invalid reference: the specified category, brand, or other relation does not exist',
        code: 'INVALID_REFERENCE',
        details: error.meta,
      });
    }
    if (error.code === 'P2025') {
      throw new NotFoundException({
        message: `Product with ID ${productId} not found`,
        code: 'PRODUCT_NOT_FOUND',
      });
    }
    throw new InternalServerErrorException({
      message: 'Failed to update product. Please try again.',
      code: 'UPDATE_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }

  async update(id: string, updateProductDto: any) {
    const productId = Number.parseInt(id, 10);

    if (isNaN(productId)) {
      this.logger.warn(`Invalid product ID format: ${id}`);
      throw new BadRequestException({
        message: 'Invalid product ID format',
        code: 'INVALID_ID',
        field: 'id',
      });
    }

    this.logger.log(`Updating product ID: ${productId}`, { updateProductDto });

    try {
      const existingProduct = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { pricing: true, dimensions: true, packaging: true },
      });

      if (!existingProduct) {
        this.logger.warn(`Product not found with ID: ${productId}`);
        throw new NotFoundException({
          message: `Product with ID ${productId} not found`,
          code: 'PRODUCT_NOT_FOUND',
        });
      }

      if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
        const duplicateSku = await this.prisma.product.findUnique({
          where: { sku: updateProductDto.sku },
        });
        if (duplicateSku) {
          this.logger.warn(`Duplicate SKU attempt: ${updateProductDto.sku}`);
          throw new BadRequestException({
            message: `Product with SKU "${updateProductDto.sku}" already exists`,
            code: 'DUPLICATE_SKU',
            field: 'sku',
          });
        }
      }

      const updatedProduct = await this.prisma.$transaction(async (tx) => {
        const productUpdateData = this.buildProductUpdateData(updateProductDto);
        // If client sent categoryIds without categoryId, mirror first as primary FK
        const categoryIdsArr = this.resolveCategoryIdsFromDto(updateProductDto);
        const subcategoryIdsArr = this.resolveSubcategoryIdsFromDto(updateProductDto);
        if (categoryIdsArr !== null && updateProductDto.categoryId === undefined) {
          productUpdateData.categoryId = categoryIdsArr[0] ?? null;
        }
        if (subcategoryIdsArr !== null && updateProductDto.subcategoryId === undefined) {
          productUpdateData.subcategoryId = subcategoryIdsArr[0] ?? null;
        }
        const updated = await tx.product.update({
          where: { id: productId },
          data: productUpdateData,
        });
        await this.upsertProductPricing(tx, productId, updateProductDto, !!existingProduct.pricing);
        const parsedImages = this.parseImagesFromDto(updateProductDto);
        if (parsedImages !== undefined) {
          await this.replaceProductImages(tx, productId, parsedImages);
        }
        await this.syncProductCategories(tx, productId, categoryIdsArr);
        await this.syncProductSubcategories(tx, productId, subcategoryIdsArr);
        return updated;
      });

      this.logger.log(`Successfully updated product ID: ${productId}`);
      return this.findOne(updatedProduct.id.toString());
    } catch (error) {
      this.mapProductUpdateError(error, productId);
    }
  }

  async remove(id: string) {
    const productId = Number.parseInt(id, 10);

    if (isNaN(productId)) {
      this.logger.warn(`Invalid product ID format for deletion: ${id}`);
      throw new BadRequestException({
        message: 'Invalid product ID format',
        code: 'INVALID_ID',
        field: 'id',
      });
    }

    this.logger.log(`Deleting product ID: ${productId}`);

    try {
      // Check if product exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        this.logger.warn(`Product not found for deletion with ID: ${productId}`);
        throw new NotFoundException({
          message: `Product with ID ${productId} not found`,
          code: 'PRODUCT_NOT_FOUND',
        });
      }

      // Delete product (related records will cascade due to onDelete: Cascade)
      await this.prisma.product.delete({
        where: { id: productId },
      });

      this.logger.log(`Successfully deleted product ID: ${productId}, SKU: ${existingProduct.sku}`);

      return {
        success: true,
        message: `Product "${existingProduct.productName}" has been deleted`,
        deletedId: productId,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error(`Failed to delete product ${productId}: ${error.message}`, error.stack);

      if (error.code === 'P2025') {
        throw new NotFoundException({
          message: `Product with ID ${productId} not found`,
          code: 'PRODUCT_NOT_FOUND',
        });
      }

      throw new InternalServerErrorException({
        message: 'Failed to delete product. Please try again.',
        code: 'DELETE_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Check if a product has sufficient available stock for the requested quantity.
   * Available = stockQty - reservedQty. Inactive products return false.
   */
  async checkStock(productId: number | string, quantity: number): Promise<boolean> {
    const id = typeof productId === 'string' ? Number.parseInt(productId, 10) : productId;

    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, isActive: true, stockQty: true, reservedQty: true },
    });

    if (!product?.isActive) {
      return false;
    }

    const available = (product.stockQty ?? 0) - (product.reservedQty ?? 0);
    return available >= quantity;
  }

  /**
   * Returns how many units of a product are currently available
   * (stockQty minus reservedQty). Returns 0 for missing/inactive products.
   */
  async getAvailableStock(productId: number | string): Promise<number> {
    const id = typeof productId === 'string' ? Number.parseInt(productId, 10) : productId;

    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { isActive: true, stockQty: true, reservedQty: true },
    });

    if (!product?.isActive) return 0;
    return Math.max(0, (product.stockQty ?? 0) - (product.reservedQty ?? 0));
  }
}
