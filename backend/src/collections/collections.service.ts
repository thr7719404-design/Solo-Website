import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto, UpdateCollectionDto } from './dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // PRODUCT COLLECTIONS
  // ============================================================================

  async getAllCollections() {
    return this.prisma.productCollection.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  async getCollection(id: string) {
    const collection = await this.prisma.productCollection.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID "${id}" not found`);
    }

    return collection;
  }

  async getCollectionByKey(key: string) {
    const collection = await this.prisma.productCollection.findUnique({
      where: { key },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with key "${key}" not found`);
    }

    return collection;
  }

  async getCollectionProducts(key: string) {
    const collection = await this.getCollectionByKey(key);
    
    // Parse ruleJson for filtering
    let rules: any = {};
    if (collection.ruleJson) {
      try {
        rules = JSON.parse(collection.ruleJson);
      } catch (e) {
        rules = {};
      }
    }

    // Build query based on strategy
    let products: any[] = [];
    const limit = collection.limit || 12;

    switch (collection.strategy) {
      case 'NEWEST':
        products = await this.prisma.product.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            pricing: true,
            images: { orderBy: { displayOrder: 'asc' } },
            brand: true,
            category: true,
          },
        });
        break;

      case 'BEST_SELLING':
        // For now, use isBestSeller flag; later can use order analytics
        products = await this.prisma.product.findMany({
          where: { isActive: true, isBestSeller: true },
          take: limit,
          include: {
            pricing: true,
            images: { orderBy: { displayOrder: 'asc' } },
            brand: true,
            category: true,
          },
        });
        break;

      case 'FEATURED':
        products = await this.prisma.product.findMany({
          where: { isActive: true, isFeatured: true },
          take: limit,
          include: {
            pricing: true,
            images: { orderBy: { displayOrder: 'asc' } },
            brand: true,
            category: true,
          },
        });
        break;

      case 'CATEGORY_FILTER':
        if (rules.categoryId) {
          products = await this.prisma.product.findMany({
            where: { isActive: true, categoryId: parseInt(rules.categoryId) },
            take: limit,
            include: {
              pricing: true,
              images: { orderBy: { displayOrder: 'asc' } },
              brand: true,
              category: true,
            },
          });
        }
        break;

      case 'BRAND_FILTER':
        if (rules.brandId) {
          products = await this.prisma.product.findMany({
            where: { isActive: true, brandId: parseInt(rules.brandId) },
            take: limit,
            include: {
              pricing: true,
              images: { orderBy: { displayOrder: 'asc' } },
              brand: true,
              category: true,
            },
          });
        }
        break;

      case 'ON_SALE':
        // Products marked as on sale with valid pricing
        products = await this.prisma.product.findMany({
          where: {
            isActive: true,
            pricing: {
              price_excl_vat_aed: { gt: 0 },
            },
            product_overrides: {
              is_on_sale: true,
            },
          },
          take: limit,
          include: {
            pricing: true,
            images: { orderBy: { displayOrder: 'asc' } },
            brand: true,
            category: true,
          },
        });
        break;

      case 'MANUAL':
      default:
        // Get products from manual collection items
        const items = await this.prisma.productCollectionItem.findMany({
          where: { collectionId: collection.id },
          orderBy: { sortOrder: 'asc' },
          take: limit,
        });

        if (items.length > 0) {
          const productIds = items.map(i => i.productId);
          products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, isActive: true },
            include: {
              pricing: true,
              images: { orderBy: { displayOrder: 'asc' } },
              brand: true,
              category: true,
            },
          });
          // Sort by collection item order
          const orderMap = new Map(items.map((item, i) => [item.productId, i]));
          products.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
        }
        break;
    }

    // Transform products to API format
    return {
      collection: {
        key: collection.key,
        title: collection.title,
        subtitle: collection.subtitle,
        strategy: collection.strategy,
      },
      products: products.map(this.transformProduct),
    };
  }

  private transformProduct(product: any) {
    const pricing = product.pricing;
    const primaryImage = product.images?.find((i: any) => i.isPrimary) || product.images?.[0];

    return {
      id: product.id,
      sku: product.sku,
      name: product.productName || product.name,
      description: product.description,
      price: pricing?.priceInclVat ? parseFloat(pricing.priceInclVat.toString()) : 0,
      salePrice: pricing?.listedPriceVat ? parseFloat(pricing.listedPriceVat.toString()) : null,
      currency: pricing?.currency || 'AED',
      imageUrl: primaryImage?.imageUrl || '/placeholder.jpg',
      images: product.images?.map((i: any) => ({
        url: i.imageUrl,
        alt: i.altText,
        isPrimary: i.isPrimary,
      })) || [],
      brand: product.brand?.brandName || null,
      category: product.category?.categoryName || null,
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      isBestSeller: product.isBestSeller,
    };
  }

  async createCollection(dto: CreateCollectionDto) {
    const existing = await this.prisma.productCollection.findUnique({ where: { key: dto.key } });
    if (existing) {
      throw new ConflictException(`Collection with key "${dto.key}" already exists`);
    }

    return this.prisma.productCollection.create({
      data: {
        key: dto.key,
        title: dto.title,
        subtitle: dto.subtitle,
        strategy: dto.strategy || 'MANUAL',
        ruleJson: dto.ruleJson ? JSON.stringify(dto.ruleJson) : null,
        limit: dto.limit ?? 12,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCollection(id: string, dto: UpdateCollectionDto) {
    await this.getCollection(id);

    if (dto.key) {
      const existing = await this.prisma.productCollection.findUnique({ where: { key: dto.key } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Collection with key "${dto.key}" already exists`);
      }
    }

    return this.prisma.productCollection.update({
      where: { id },
      data: {
        ...(dto.key && { key: dto.key }),
        ...(dto.title && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.strategy && { strategy: dto.strategy }),
        ...(dto.ruleJson !== undefined && { ruleJson: dto.ruleJson ? JSON.stringify(dto.ruleJson) : null }),
        ...(dto.limit !== undefined && { limit: dto.limit }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteCollection(id: string) {
    await this.getCollection(id);
    return this.prisma.productCollection.delete({ where: { id } });
  }

  // Collection Items (for MANUAL strategy)
  async addCollectionItem(collectionId: string, productId: number, sortOrder?: number) {
    const collection = await this.getCollection(collectionId);
    
    const existing = await this.prisma.productCollectionItem.findUnique({
      where: { collectionId_productId: { collectionId, productId } },
    });

    if (existing) {
      throw new ConflictException('Product already in collection');
    }

    // Get next sort order if not provided
    const order = sortOrder ?? (await this.prisma.productCollectionItem.count({ where: { collectionId } }));

    return this.prisma.productCollectionItem.create({
      data: {
        collectionId,
        productId,
        sortOrder: order,
      },
    });
  }

  async removeCollectionItem(collectionId: string, productId: number) {
    const item = await this.prisma.productCollectionItem.findUnique({
      where: { collectionId_productId: { collectionId, productId } },
    });

    if (!item) {
      throw new NotFoundException('Product not in collection');
    }

    return this.prisma.productCollectionItem.delete({
      where: { id: item.id },
    });
  }

  async reorderCollectionItems(collectionId: string, orders: Array<{ productId: number; sortOrder: number }>) {
    await this.getCollection(collectionId);

    await this.prisma.$transaction(
      orders.map((order) =>
        this.prisma.productCollectionItem.updateMany({
          where: { collectionId, productId: order.productId },
          data: { sortOrder: order.sortOrder },
        })
      )
    );

    return this.getCollection(collectionId);
  }
}
