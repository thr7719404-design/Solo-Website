import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  private readonly uploadsBaseUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.uploadsBaseUrl =
      this.configService.get<string>('APP_URL', 'http://localhost:3000') + '/uploads';
  }

  /**
   * Get all favorites for a user with product details
   */
  async getFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch product details from inventory
    const productIds = favorites.map(f => f.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        brand: true,
        category: true,
        pricing: true,
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Resolve media_asset_id UUIDs to actual URLs
    const mediaIds = products
      .flatMap(p => p.images?.map((img: any) => img.media_asset_id) || [])
      .filter(Boolean);
    const urlMap = new Map<string, string>();
    if (mediaIds.length > 0) {
      const assets = await this.prisma.media_assets.findMany({
        where: { id: { in: [...new Set(mediaIds)] } },
        select: { id: true, key: true },
      });
      for (const a of assets) {
        urlMap.set(a.id, `${this.uploadsBaseUrl}/${a.key}`);
      }
    }

    return favorites.map(fav => {
      const product = productMap.get(fav.productId);
      if (!product) return null;
      const rawMediaId = product.images[0]?.media_asset_id || '';
      const imageUrl = urlMap.get(rawMediaId) || rawMediaId;
      return {
        id: fav.id,
        productId: fav.productId.toString(),
        createdAt: fav.createdAt,
        product: {
          id: product.id.toString(),
          sku: product.sku,
          name: product.productName,
          description: product.description,
          price: product.pricing?.price_incl_vat_aed ? Number(product.pricing.price_incl_vat_aed) : 0,
          listPrice: product.pricing?.price_excl_vat_aed ? Number(product.pricing.price_excl_vat_aed) : null,
          currency: 'AED',
          imageUrl,
          images: product.images?.map((img: any) => ({
            id: img.id,
            url: urlMap.get(img.media_asset_id) || img.media_asset_id,
            alt: img.altText || product.productName,
            displayOrder: img.displayOrder,
          })) || [],
          brand: product.brand ? {
            id: product.brand.id.toString(),
            name: product.brand.name,
          } : null,
          category: product.category ? {
            id: product.category.id.toString(),
            name: product.category.name,
          } : null,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        },
      };
    }).filter(fav => fav !== null);
  }

  /**
   * Add a product to favorites
   */
  async addFavorite(userId: string, productId: number) {
    // Check if product exists in inventory
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if already favorited
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      throw new ConflictException('Product is already in favorites');
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        productId,
      },
    });

    return {
      id: favorite.id,
      productId: favorite.productId.toString(),
      createdAt: favorite.createdAt,
      message: 'Product added to favorites',
    };
  }

  /**
   * Remove a product from favorites
   */
  async removeFavorite(userId: string, productId: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Product not in favorites');
    }

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return { message: 'Product removed from favorites' };
  }

  /**
   * Check if a product is in user's favorites
   */
  async isFavorite(userId: string, productId: number): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    return !!favorite;
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(userId: string, productId: number) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { isFavorite: false, message: 'Removed from favorites' };
    } else {
      // Verify product exists
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      await this.prisma.favorite.create({
        data: { userId, productId },
      });
      return { isFavorite: true, message: 'Added to favorites' };
    }
  }

  /**
   * Get favorite product IDs for a user (for quick lookup)
   */
  async getFavoriteIds(userId: string): Promise<number[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { productId: true },
    });

    return favorites.map(f => f.productId);
  }
}
