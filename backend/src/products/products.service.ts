import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ProductFilterDto, SortBy } from './dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly uploadsBaseUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.uploadsBaseUrl =
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
    const page = typeof rawPage === 'string' ? parseInt(rawPage, 10) : rawPage;
    const limit = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : rawLimit;

    const searchTerm = search || q;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // ─────────────────────────────────────────────────────────────────────────
    // STATUS FILTER: supports 'status' param or 'isActive' param
    // ─────────────────────────────────────────────────────────────────────────
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'draft') {
      where.isActive = false;
    } else if (status === 'out_of_stock') {
      // Out of stock: we'll filter after fetch since stock is in pricing/inventory
      // For now, keep isActive filter and handle stock client-side or via inStock
      where.isActive = true; // Only show active products that are out of stock
    } else if (isActive === 'true') {
      where.isActive = true;
    } else if (isActive === 'false') {
      where.isActive = false;
    } else {
      // Default: show only active products for public endpoints
      // For admin, we want all - but this is a shared endpoint
      // So we default to active unless status/isActive is specified
      where.isActive = true;
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (categoryId) {
      const parsed = Number.parseInt(categoryId, 10);
      if (Number.isNaN(parsed)) {
        // Treat as slug – resolve to numeric ID
        const cat = await this.prisma.category.findFirst({ where: { slug: categoryId } });
        if (cat) where.categoryId = cat.id;
      } else {
        where.categoryId = parsed;
      }
    }

    if (subcategoryId) {
      where.subcategoryId = parseInt(subcategoryId);
    }

    if (brandId) {
      where.brandId = parseInt(brandId);
    }

    if (brandIds && brandIds.length > 0) {
      where.brandId = { in: brandIds.map(id => parseInt(id)) };
    }

    if (searchTerm) {
      where.OR = [
        { productName: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    if (isNew === 'true') {
      where.isNew = true;
    }

    if (isBestSeller === 'true') {
      where.isBestSeller = true;
    }

    if (isOnSale === 'true') {
      where.product_overrides = {
        is_on_sale: true,
      };
    }

    // Price range filter — pushed into Prisma where clause (not in-memory)
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = {};
      if (minPrice !== undefined) priceFilter.gte = minPrice;
      if (maxPrice !== undefined) priceFilter.lte = maxPrice;
      where.pricing = { price_incl_vat_aed: priceFilter };
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case SortBy.PRICE_LOW:
        orderBy = { pricing: { price_incl_vat_aed: 'asc' } };
        break;
      case SortBy.PRICE_HIGH:
        orderBy = { pricing: { price_incl_vat_aed: 'desc' } };
        break;
      case SortBy.NAME_ASC:
        orderBy = { productName: 'asc' };
        break;
      case SortBy.NAME_DESC:
        orderBy = { productName: 'desc' };
        break;
      case SortBy.NEWEST:
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Fetch products with pricing
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          brand: true,
          category: true,
          subcategory: true,
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
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
      } : null,
      price: product.pricing?.price_incl_vat_aed ? parseFloat(product.pricing.price_incl_vat_aed.toString()) : 0,
      listPrice: product.pricing?.price_excl_vat_aed ? parseFloat(product.pricing.price_excl_vat_aed.toString()) : null,
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

  async getRelated(productId: string, limit: number = 6) {
    const product = await this.prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const relatedProducts = await this.prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: parseInt(productId) },
        OR: [
          { categoryId: product.categoryId },
          { brandId: product.brandId },
        ],
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

    await this.resolveProductImageUrls(relatedProducts);

    return {
      data: relatedProducts.map(p => this.transformProduct(p)),
      count: relatedProducts.length,
    };
  }

  async findOne(slugOrId: string) {
    const id = parseInt(slugOrId);
    
    const product = await this.prisma.product.findFirst({
      where: isNaN(id) ? { sku: slugOrId } : { id },
      include: {
        brand: true,
        category: true,
        subcategory: true,
        pricing: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        dimensions: true,
        packaging: true,
        specifications: true,
      },
    }) as any;

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.resolveProductImageUrls([product]);

    return this.transformProduct(product, true);
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
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
      } : null,
      price: product.pricing?.price_incl_vat_aed ? parseFloat(product.pricing.price_incl_vat_aed.toString()) : 0,
      listPrice: product.pricing?.price_excl_vat_aed ? parseFloat(product.pricing.price_excl_vat_aed.toString()) : null,
      currency: 'AED',
      imageUrl: product.images?.[0]?.media_asset_id || null,
      images: product.images?.map((img: any) => ({
        id: img.id,
        url: img.media_asset_id,
        alt: img.altText || product.productName,
        displayOrder: img.displayOrder,
      })) || [],
      inStock: true,
      material: product.material,
      color: product.colour,
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      isBestSeller: product.isBestSeller,
      isActive: product.isActive,
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
        // Create main product record
        const newProduct = await tx.product.create({
          data: {
            sku: createProductDto.sku,
            productName: createProductDto.name,
            description: createProductDto.description,
            categoryId: createProductDto.categoryId ? parseInt(createProductDto.categoryId) : null,
            subcategoryId: createProductDto.subcategoryId ? parseInt(createProductDto.subcategoryId) : null,
            brandId: createProductDto.brandId ? parseInt(createProductDto.brandId) : null,
            designerId: createProductDto.designerId ? parseInt(createProductDto.designerId) : null,
            countryId: createProductDto.countryId ? parseInt(createProductDto.countryId) : null,
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
        const imageUrls: string[] = createProductDto.images?.length
          ? createProductDto.images.slice(0, 5)
          : createProductDto.imageUrl
            ? [createProductDto.imageUrl]
            : [];

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

  async update(id: string, updateProductDto: any) {
    const productId = parseInt(id, 10);
    
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
      // Check if product exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          pricing: true,
          dimensions: true,
          packaging: true,
        },
      });

      if (!existingProduct) {
        this.logger.warn(`Product not found with ID: ${productId}`);
        throw new NotFoundException({
          message: `Product with ID ${productId} not found`,
          code: 'PRODUCT_NOT_FOUND',
        });
      }

      // If SKU is being changed, check for duplicates
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

      // Update product with transaction
      const updatedProduct = await this.prisma.$transaction(async (tx) => {
        // Build update data for main product
        const productUpdateData: any = {};

        if (updateProductDto.sku !== undefined) productUpdateData.sku = updateProductDto.sku;
        if (updateProductDto.name !== undefined) productUpdateData.productName = updateProductDto.name;
        if (updateProductDto.description !== undefined) productUpdateData.description = updateProductDto.description;
        if (updateProductDto.categoryId !== undefined) {
          productUpdateData.categoryId = updateProductDto.categoryId ? parseInt(updateProductDto.categoryId) : null;
        }
        if (updateProductDto.subcategoryId !== undefined) {
          productUpdateData.subcategoryId = updateProductDto.subcategoryId ? parseInt(updateProductDto.subcategoryId) : null;
        }
        if (updateProductDto.brandId !== undefined) {
          productUpdateData.brandId = updateProductDto.brandId ? parseInt(updateProductDto.brandId) : null;
        }
        if (updateProductDto.designerId !== undefined) {
          productUpdateData.designerId = updateProductDto.designerId ? parseInt(updateProductDto.designerId) : null;
        }
        if (updateProductDto.countryId !== undefined) {
          productUpdateData.countryId = updateProductDto.countryId ? parseInt(updateProductDto.countryId) : null;
        }
        if (updateProductDto.material !== undefined) productUpdateData.material = updateProductDto.material;
        if (updateProductDto.colour !== undefined) productUpdateData.colour = updateProductDto.colour;
        if (updateProductDto.size !== undefined) productUpdateData.size = updateProductDto.size;
        if (updateProductDto.isActive !== undefined) productUpdateData.isActive = updateProductDto.isActive;
        if (updateProductDto.isDiscontinued !== undefined) productUpdateData.isDiscontinued = updateProductDto.isDiscontinued;
        if (updateProductDto.isFeatured !== undefined) productUpdateData.isFeatured = updateProductDto.isFeatured;
        if (updateProductDto.isNew !== undefined) productUpdateData.isNew = updateProductDto.isNew;
        if (updateProductDto.isBestSeller !== undefined) productUpdateData.isBestSeller = updateProductDto.isBestSeller;

        // ==== NEW: Product Page Fields v1 ====
        if (updateProductDto.shortDescription !== undefined) productUpdateData.shortDescription = updateProductDto.shortDescription;
        if (updateProductDto.fullDescription !== undefined) productUpdateData.fullDescription = updateProductDto.fullDescription;
        if (updateProductDto.highlights !== undefined) productUpdateData.highlights = updateProductDto.highlights;
        if (updateProductDto.specs !== undefined) productUpdateData.specs = updateProductDto.specs;
        if (updateProductDto.deliveryNote !== undefined) productUpdateData.deliveryNote = updateProductDto.deliveryNote;
        if (updateProductDto.returnsNote !== undefined) productUpdateData.returnsNote = updateProductDto.returnsNote;
        if (updateProductDto.urlSlug !== undefined) productUpdateData.slug = updateProductDto.urlSlug;
        if (updateProductDto.slug !== undefined) productUpdateData.slug = updateProductDto.slug;
        if (updateProductDto.metaTitle !== undefined) productUpdateData.metaTitle = updateProductDto.metaTitle;
        if (updateProductDto.metaDescription !== undefined) productUpdateData.metaDescription = updateProductDto.metaDescription;
        // ==== END: Product Page Fields v1 ====

        // Stock
        if (updateProductDto.stock !== undefined) productUpdateData.stockQty = updateProductDto.stock;

        // Update main product record
        const updated = await tx.product.update({
          where: { id: productId },
          data: productUpdateData,
        });

        // Update pricing if price is provided
        if (updateProductDto.price !== undefined || updateProductDto.compareAtPrice !== undefined) {
          const pricingData: any = {};
          if (updateProductDto.price !== undefined) pricingData.price_incl_vat_aed = updateProductDto.price;
          if (updateProductDto.compareAtPrice !== undefined) pricingData.price_excl_vat_aed = updateProductDto.compareAtPrice;

          if (existingProduct.pricing) {
            // Update existing pricing
            await tx.productPricing.update({
              where: { productId },
              data: pricingData,
            });
          } else {
            // Create new pricing record
            await tx.productPricing.create({
              data: {
                productId,
                price_incl_vat_aed: updateProductDto.price ?? 0,
                price_excl_vat_aed: updateProductDto.compareAtPrice ?? 0,
              },
            });
          }
        }

        // Update images (multi-image support, up to 5)
        const newImageUrls: string[] | undefined = updateProductDto.images?.length
          ? updateProductDto.images.slice(0, 5)
          : updateProductDto.imageUrl !== undefined
            ? (updateProductDto.imageUrl ? [updateProductDto.imageUrl] : [])
            : undefined;

        if (newImageUrls !== undefined) {
          // Delete old images and replace with new set
          await tx.productImage.deleteMany({ where: { productId } });
          if (newImageUrls.length > 0) {
            await tx.productImage.createMany({
              data: newImageUrls.map((url, idx) => ({
                productId,
                media_asset_id: url,
                displayOrder: idx,
                isPrimary: idx === 0,
              })),
            });
          }
        }

        return updated;
      });

      this.logger.log(`Successfully updated product ID: ${productId}`);

      // Return the updated product with full details
      return this.findOne(updatedProduct.id.toString());
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error(`Failed to update product ${productId}: ${error.message}`, error.stack);

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
  }

  async remove(id: string) {
    const productId = parseInt(id, 10);

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
   * Check if a product has sufficient stock for the requested quantity.
   * Since Product doesn't have a stock field, we always return true for now.
   * TODO: Implement actual stock checking when inventory tracking is added.
   */
  async checkStock(productId: number | string, quantity: number): Promise<boolean> {
    const id = typeof productId === 'string' ? parseInt(productId, 10) : productId;
    
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      return false;
    }
    
    // If product is not active, treat as out of stock
    if (!product.isActive) {
      return false;
    }
    
    // TODO: Check actual stock when inventory tracking is implemented
    // For now, all active products are considered in stock
    return true;
  }
}
