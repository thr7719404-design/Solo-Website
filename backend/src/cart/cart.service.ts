import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { SettingsService } from '../settings/settings.service';
import { AddCartItemDto, UpdateCartItemDto, CartItemType } from './dto';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly settingsService: SettingsService,
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
      products.map((p: any) => {
        const stockQty = p.stockQty ?? 0;
        const reservedQty = p.reservedQty ?? 0;
        const available = Math.max(0, stockQty - reservedQty);
        return [
          p.id,
          {
            id: p.id.toString(),
            name: p.productName,
            description: p.description,
            price: p.pricing?.price_incl_vat_aed
              ? Number.parseFloat(p.pricing.price_incl_vat_aed.toString())
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
            stockQty,
            reservedQty,
            available,
            inStock: available > 0 && p.isActive !== false,
          },
        ];
      }),
    );

    // Attach transformed product data to items
    return items.map((item) => ({
      ...item,
      product: item.productId ? transformedMap.get(item.productId) || null : null,
    }));
  }

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: true,
      },
    });

    cart ??= await this.prisma.cart.create({
      data: { userId },
      include: {
        items: true,
      },
    });

    // Enrich cart items with product data from inventory schema
    const enrichedItems = await this.enrichCartItemsWithProducts(cart.items);

    return await this.calculateCartTotals({
      ...cart,
      items: enrichedItems,
    });
  }

  async addItem(userId: string, addCartItemDto: AddCartItemDto) {
    const { type, itemId, quantity } = addCartItemDto;

    // Get or create cart
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });

    // Create cart if not exists
    cart ??= await this.prisma.cart.create({
      data: { userId },
      include: { items: true },
    });

    // Validate item exists and stock is available
    if (type === CartItemType.PRODUCT) {
      // itemId should be the product ID (Int for Product)
      const productId = typeof itemId === 'string' ? Number.parseInt(itemId, 10) : itemId;

      // Check if item already in cart so we know the new total quantity
      const existingItem = cart.items.find(
        (item) => item.productId === productId,
      );
      const newQuantity = (existingItem?.quantity ?? 0) + quantity;

      // Validate against true availability (stockQty - reservedQty)
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, productName: true, isActive: true, stockQty: true, reservedQty: true },
      });
      if (!product?.isActive) {
        throw new BadRequestException('Product is not available');
      }
      const available = Math.max(0, (product.stockQty ?? 0) - (product.reservedQty ?? 0));
      if (available <= 0) {
        throw new BadRequestException(`${product.productName} is out of stock`);
      }
      if (newQuantity > available) {
        throw new BadRequestException(
          `Only ${available} unit${available === 1 ? '' : 's'} of ${product.productName} available (you requested ${newQuantity})`,
        );
      }

      if (existingItem) {
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
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock against true availability (stockQty - reservedQty)
    if (cartItem.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: cartItem.productId },
        select: { productName: true, isActive: true, stockQty: true, reservedQty: true },
      });
      if (!product?.isActive) {
        throw new BadRequestException('Product is not available');
      }
      const available = Math.max(0, (product.stockQty ?? 0) - (product.reservedQty ?? 0));
      if (available <= 0) {
        throw new BadRequestException(`${product.productName} is out of stock`);
      }
      if (quantity > available) {
        throw new BadRequestException(
          `Only ${available} unit${available === 1 ? '' : 's'} of ${product.productName} available`,
        );
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
          ? Number.parseFloat(item.product.price.toString()) 
          : Number(item.product.price);
        subtotal += price * item.quantity;
      }
    }

    const vatRate = await this.settingsService.getVatRate();
    const vat = subtotal * vatRate; // Dynamic VAT from settings
    // Shipping is mandatory on every order — read admin-configured fee
    // from SiteSetting `shipping_fee` (default AED 10).
    const shipping = await this.settingsService.getShippingFee();
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
