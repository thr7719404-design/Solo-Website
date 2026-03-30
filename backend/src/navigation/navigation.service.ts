import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNavigationMenuDto, UpdateNavigationMenuDto, CreateNavigationMenuItemDto, UpdateNavigationMenuItemDto } from './dto';

@Injectable()
export class NavigationService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // NAVIGATION MENUS
  // ============================================================================

  async getAllMenus() {
    return this.prisma.navigationMenu.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  async getMenu(id: string) {
    const menu = await this.prisma.navigationMenu.findUnique({
      where: { id },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              orderBy: { sortOrder: 'asc' },
              include: {
                children: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException(`Navigation menu with ID "${id}" not found`);
    }

    return menu;
  }

  async getMenuByKey(key: string) {
    const menu = await this.prisma.navigationMenu.findUnique({
      where: { key },
      include: {
        items: {
          where: { parentId: null, isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                children: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException(`Navigation menu with key "${key}" not found`);
    }

    return menu;
  }

  async createMenu(dto: CreateNavigationMenuDto) {
    const existing = await this.prisma.navigationMenu.findUnique({ where: { key: dto.key } });
    if (existing) {
      throw new ConflictException(`Navigation menu with key "${dto.key}" already exists`);
    }

    return this.prisma.navigationMenu.create({
      data: {
        key: dto.key,
        name: dto.name,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateMenu(id: string, dto: UpdateNavigationMenuDto) {
    await this.getMenu(id);

    if (dto.key) {
      const existing = await this.prisma.navigationMenu.findUnique({ where: { key: dto.key } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Navigation menu with key "${dto.key}" already exists`);
      }
    }

    return this.prisma.navigationMenu.update({
      where: { id },
      data: {
        ...(dto.key && { key: dto.key }),
        ...(dto.name && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteMenu(id: string) {
    await this.getMenu(id);
    return this.prisma.navigationMenu.delete({ where: { id } });
  }

  // ============================================================================
  // NAVIGATION MENU ITEMS
  // ============================================================================

  async getMenuItem(id: string) {
    const item = await this.prisma.navigationMenuItem.findUnique({
      where: { id },
      include: {
        menu: true,
        parent: true,
        children: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!item) {
      throw new NotFoundException(`Navigation menu item with ID "${id}" not found`);
    }

    return item;
  }

  async createMenuItem(dto: CreateNavigationMenuItemDto) {
    // Validate menu exists
    const menu = await this.prisma.navigationMenu.findUnique({ where: { id: dto.menuId } });
    if (!menu) {
      throw new NotFoundException(`Navigation menu with ID "${dto.menuId}" not found`);
    }

    // Validate parent if provided
    if (dto.parentId) {
      const parent = await this.prisma.navigationMenuItem.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent menu item with ID "${dto.parentId}" not found`);
      }
    }

    return this.prisma.navigationMenuItem.create({
      data: {
        menuId: dto.menuId,
        parentId: dto.parentId,
        label: dto.label,
        url: dto.url,
        icon: dto.icon,
        badge: dto.badge,
        badgeColor: dto.badgeColor,
        imageUrl: dto.imageUrl,
        description: dto.description,
        openInNewTab: dto.openInNewTab ?? false,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        menu: true,
        parent: true,
      },
    });
  }

  async updateMenuItem(id: string, dto: UpdateNavigationMenuItemDto) {
    await this.getMenuItem(id);

    // Validate parent if changed
    if (dto.parentId) {
      const parent = await this.prisma.navigationMenuItem.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent menu item with ID "${dto.parentId}" not found`);
      }
      // Prevent circular reference
      if (parent.id === id) {
        throw new ConflictException('Cannot set item as its own parent');
      }
    }

    return this.prisma.navigationMenuItem.update({
      where: { id },
      data: {
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.label && { label: dto.label }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.badge !== undefined && { badge: dto.badge }),
        ...(dto.badgeColor !== undefined && { badgeColor: dto.badgeColor }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.openInNewTab !== undefined && { openInNewTab: dto.openInNewTab }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        menu: true,
        parent: true,
      },
    });
  }

  async deleteMenuItem(id: string) {
    await this.getMenuItem(id);
    return this.prisma.navigationMenuItem.delete({ where: { id } });
  }

  async reorderMenuItems(menuId: string, orders: Array<{ id: string; sortOrder: number }>) {
    await this.getMenu(menuId);

    await this.prisma.$transaction(
      orders.map((order) =>
        this.prisma.navigationMenuItem.update({
          where: { id: order.id },
          data: { sortOrder: order.sortOrder },
        })
      )
    );

    return this.getMenu(menuId);
  }
}
