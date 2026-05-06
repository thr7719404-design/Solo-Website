import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly uploadsBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadsBaseUrl =
      this.configService.get<string>('UPLOAD_BASE_URL') ||
      this.configService.get<string>('APP_URL', 'http://localhost:3000') + '/uploads';
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // ============================================================================
  // ORDERS
  // ============================================================================

  async getUserOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    // Fetch shipping addresses separately so orphan FKs don't break the listing.
    const shippingIds = Array.from(
      new Set(orders.map((o) => o.shippingAddressId).filter(Boolean) as string[]),
    );
    const shippingAddresses = shippingIds.length
      ? await this.prisma.address.findMany({ where: { id: { in: shippingIds } } })
      : [];
    const addrMap = new Map(shippingAddresses.map((a) => [a.id, a]));

    return orders.map((order) => {
      const ship = order.shippingAddressId ? addrMap.get(order.shippingAddressId) : null;
      return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      discount: order.discount,
      vat: order.vat,
      vatAmount: order.vatAmount,
      subtotalExclVat: order.subtotalExclVat,
      vatRateSnapshot: order.vatRateSnapshot,
      shippingCost: order.shippingCost,
      total: order.total,
      itemsCount: order.items.length,
      createdAt: order.createdAt,
      shippingAddress: {
        city: ship?.city ?? '',
      },
      };
    });
  }

  async getUserOrder(userId: string, orderId: string) {
    const baseOrder = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!baseOrder) {
      throw new NotFoundException('Order not found');
    }

    const [shippingAddress, billingAddress] = await Promise.all([
      baseOrder.shippingAddressId
        ? this.prisma.address.findUnique({ where: { id: baseOrder.shippingAddressId } }).catch(() => null)
        : null,
      baseOrder.billingAddressId
        ? this.prisma.address.findUnique({ where: { id: baseOrder.billingAddressId } }).catch(() => null)
        : null,
    ]);
    const order: any = { ...baseOrder, shippingAddress, billingAddress };

    // Resolve product images for order items
    const productIds = (order.items as any[])
      .map((item: any) => item.productId)
      .filter((id: any): id is number => id !== null);

    if (productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          images: {
            orderBy: { displayOrder: 'asc' },
            take: 1,
          },
        },
      });

      // Resolve media asset UUIDs to URLs
      const mediaIds = products
        .flatMap((p) => p.images?.map((img) => img.media_asset_id) || [])
        .filter(Boolean);
      const uniqueIds = [...new Set(mediaIds)];
      const assets = uniqueIds.length > 0
        ? await this.prisma.media_assets.findMany({
            where: { id: { in: uniqueIds } },
            select: { id: true, key: true },
          })
        : [];
      const urlMap = new Map(assets.map((a) => [a.id, `${this.uploadsBaseUrl}/${a.key}`]));

      // Build productId → imageUrl map
      const imageMap = new Map<number, string>();
      for (const p of products) {
        const img = p.images?.[0];
        if (img) {
          imageMap.set(p.id, urlMap.get(img.media_asset_id) || img.media_asset_id);
        }
      }

      // Attach imageUrl to each order item
      const enrichedItems = (order.items as any[]).map((item: any) => ({
        ...item,
        imageUrl: item.productId ? imageMap.get(item.productId) || null : null,
      }));

      return { ...order, items: enrichedItems };
    }

    return order;
  }

  // ============================================================================
  // ADDRESSES
  // ============================================================================

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async createAddress(userId: string, addressData: any) {
    // Check if user has any existing addresses
    const existingAddresses = await this.prisma.address.count({
      where: { userId },
    });

    // If this is the user's first address, force it to be default
    const isDefault = existingAddresses === 0 ? true : addressData.isDefault;

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        ...addressData,
        userId,
        isDefault,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, addressData: any) {
    // Verify address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // If setting as default, unset other defaults
    if (addressData.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: addressData,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    // If deleted address was default, make the first remaining address default
    if (address.isDefault) {
      const firstAddress = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      if (firstAddress) {
        await this.prisma.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    // Verify address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Transaction: unset all defaults, then set chosen one
    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    return { message: 'Default address updated successfully' };
  }
}
