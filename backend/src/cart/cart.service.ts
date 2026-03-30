import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { SettingsService } from '../settings/settings.service';
import { AddCartItemDto, UpdateCartItemDto, CartItemType } from './dto';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private settingsService: SettingsService,
  ) {}

  /**
   * Fetch product data from inventory schema and attach to cart items.
   * Transforms data to match the same shape as the products API
   * (name, price, image url) so the frontend can parse it consistently.
   */
  private async enrichCartItemsWithProducts(items: any[]) {
    // Get unique product IDs from cart items
    const productIds = items
      .filter((item) => item.productId !== null)
      .map((item) => item.productId);

    if (productIds.length === 0) {
      return items.map((item) => ({ ...item, product: null }));
    }

    // Fetch products from inventory schema — include pricing for price data
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        pricing: true,
      },
    });

    // Resolve media asset UUIDs to actual image URLs
    await this.productsService.resolveProductImageUrls(products as any[]);

    // Transform to the same API shape the frontend expects
    const transformedMap = new Map(
      products.map((p: any) => [
        p.id,
        {
          id: p.id.toString(),
          name: p.productName,
          description: p.description,
          price: p.pricing?.price_incl_vat_aed
            ? parseFloat(p.pricing.price_incl_vat_aed.toString())
            : 0,
          images: p.images?.map((img: any) => ({
            id: img.id,
            url: img.media_asset_id,
            alt: img.altText || p.productName,
            displayOrder: img.displayOrder,
          })) || [],
          brand: p.brand
            ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug }
            : null,
        },
      ]),
    );

    // Attach transformed product data to items
    return items.map((item) => ({
      ...item,
      product: item.productId ? transformedMap.get(item.productId) || null : null,
    }));
  }

  /**
   * Enrich package items with product data
   */
  private async enrichPackageItemsWithProducts(packageItems: any[]) {
    const productIds = packageItems.map((item) => item.productId);
    
    if (productIds.length === 0) {
      return packageItems;
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return packageItems.map((item) => ({
      ...item,
      product: productMap.get(item.productId) || null,
    }));
  }

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            package: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              package: {
                include: {
                  items: true,
                },
              },
            },
          },
        },
      });
    }

    // Enrich cart items with product data from inventory schema
    const enrichedItems = await this.enrichCartItemsWithProducts(cart.items);
    
    // Also enrich package items
    for (const item of enrichedItems) {
      if (item.package?.items) {
        item.package.items = await this.enrichPackageItemsWithProducts(item.package.items);
      }
    }

    return await this.calculateCartTotals({
      ...cart,
      items: enrichedItems,
    });
  }

  async addItem(userId: string, addCartItemDto: AddCartItemDto) {
    const { type, itemId, quantity, customization } = addCartItemDto;

    // Get or create cart
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      // Create cart if not exists
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    // Validate item exists and stock is available
    if (type === CartItemType.PRODUCT) {
      // itemId should be the product ID (Int for Product)
      const productId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      
      const hasStock = await this.productsService.checkStock(productId, quantity);
      if (!hasStock) {
        throw new BadRequestException('Insufficient stock');
      }

      // Check if item already in cart
      const existingItem = cart.items.find(
        (item) => item.productId === productId && !item.packageId,
      );

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        const hasStockForNew = await this.productsService.checkStock(productId, newQuantity);
        
        if (!hasStockForNew) {
          throw new BadRequestException('Insufficient stock for requested quantity');
        }

        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        // Add new item
        await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            type: 'PRODUCT',
            productId: productId,
            quantity,
          },
        });
      }
    } else if (type === CartItemType.PACKAGE) {
      // Validate package exists
      const pkg = await this.prisma.package.findUnique({
        where: { id: itemId },
        include: {
          items: true,
        },
      });

      if (!pkg) {
        throw new NotFoundException('Package not found');
      }

      if (!pkg.isActive) {
        throw new BadRequestException('Package is not available');
      }

      // Fetch product data for package items
      const enrichedPackageItems = await this.enrichPackageItemsWithProducts(pkg.items);

      // Check stock for all items in package
      for (const item of enrichedPackageItems) {
        const hasStock = await this.productsService.checkStock(
          item.productId,
          item.quantity * quantity,
        );
        if (!hasStock) {
          throw new BadRequestException(
            `Insufficient stock for ${item.product?.name || 'product'} in package`,
          );
        }
      }

      // Check if package already in cart
      const existingItem = cart.items.find(
        (item) => item.packageId === itemId,
      );

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        
        // Re-check stock for new quantity
        for (const item of enrichedPackageItems) {
          const hasStock = await this.productsService.checkStock(
            item.productId,
            item.quantity * newQuantity,
          );
          if (!hasStock) {
            throw new BadRequestException(
              `Insufficient stock for ${item.product?.name || 'product'} in package`,
            );
          }
        }

        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        // Add new package item
        await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            type: 'PACKAGE',
            packageId: itemId,
            quantity,
          },
        });
      }
    }

    return this.getOrCreateCart(userId);
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const { quantity } = updateCartItemDto;

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      include: {
        package: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock
    if (cartItem.productId) {
      const hasStock = await this.productsService.checkStock(
        cartItem.productId,
        quantity,
      );
      if (!hasStock) {
        throw new BadRequestException('Insufficient stock');
      }
    } else if (cartItem.packageId && cartItem.package) {
      const enrichedPackageItems = await this.enrichPackageItemsWithProducts(cartItem.package.items);
      for (const item of enrichedPackageItems) {
        const hasStock = await this.productsService.checkStock(
          item.productId,
          item.quantity * quantity,
        );
        if (!hasStock) {
          throw new BadRequestException(
            `Insufficient stock for ${item.product?.name || 'product'} in package`,
          );
        }
      }
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getOrCreateCart(userId);
  }

  private async calculateCartTotals(cart: any) {
    let itemCount = 0;
    let subtotal = 0;

    for (const item of cart.items) {
      itemCount += item.quantity;

      if (item.product) {
        // Product price is a Decimal, convert to number
        const price = typeof item.product.price === 'object' 
          ? parseFloat(item.product.price.toString()) 
          : Number(item.product.price);
        subtotal += price * item.quantity;
      } else if (item.package) {
        const price = typeof item.package.price === 'object'
          ? parseFloat(item.package.price.toString())
          : Number(item.package.price);
        subtotal += price * item.quantity;
      }
    }

    const vatRate = await this.settingsService.getVatRate();
    const vat = subtotal * vatRate; // Dynamic VAT from settings
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const total = subtotal + vat + shipping;

    return {
      ...cart,
      summary: {
        itemCount,
        subtotal: Math.round(subtotal * 100) / 100,
        vat: Math.round(vat * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100,
      },
    };
  }
}
