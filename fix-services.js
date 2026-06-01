const fs = require('fs');
const path = require('path');

// ─── brands.service.ts ───────────────────────────────────────────────────────
const brandsService = `import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
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
   * Resolve logo URLs for brands:
   * 1. Use logo_id → media_assets if set
   * 2. Fall back to first product image for the brand
   */
  private async resolveLogoUrls(
    brands: Array<{ id: number; logo_id: string | null }>,
  ): Promise<Map<number, string>> {
    const logoMap = new Map<number, string>();

    // Step 1: resolve existing logo_id UUIDs from media_assets
    const withLogo = brands.filter(b => b.logo_id);
    if (withLogo.length > 0) {
      const assets = await this.prisma.media_assets.findMany({
        where: { id: { in: withLogo.map(b => b.logo_id!) } },
        select: { id: true, key: true },
      });
      const urlMap = new Map(assets.map(a => [a.id, \`\${this.uploadsBaseUrl}/\${a.key}\`]));
      for (const b of withLogo) {
        const url = urlMap.get(b.logo_id!);
        if (url) logoMap.set(b.id, url);
      }
    }

    // Step 2: for brands still without a logo, use the first product image
    const withoutLogo = brands.filter(b => !logoMap.has(b.id));
    if (withoutLogo.length > 0) {
      const brandIds = withoutLogo.map(b => b.id);
      const products = await this.prisma.product.findMany({
        where: { brandId: { in: brandIds }, isActive: true, images: { some: {} } },
        select: {
          brandId: true,
          images: {
            orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
            take: 1,
            select: { media_asset_id: true },
          },
        },
        distinct: ['brandId'],
      });

      const mediaIds = products
        .map(p => p.images[0]?.media_asset_id)
        .filter(Boolean) as string[];

      if (mediaIds.length > 0) {
        const assets = await this.prisma.media_assets.findMany({
          where: { id: { in: [...new Set(mediaIds)] } },
          select: { id: true, key: true },
        });
        const urlMap = new Map(assets.map(a => [a.id, \`\${this.uploadsBaseUrl}/\${a.key}\`]));
        for (const p of products) {
          const mediaId = p.images[0]?.media_asset_id;
          if (p.brandId && mediaId) {
            const url = urlMap.get(mediaId);
            if (url) logoMap.set(p.brandId, url);
          }
        }
      }
    }

    return logoMap;
  }

  async create(createBrandDto: CreateBrandDto) {
    // Check if brand name already exists
    const existing = await this.prisma.brand.findFirst({
      where: { name: createBrandDto.name },
    });

    if (existing) {
      throw new ConflictException('Brand with this name already exists');
    }

    const slug = (createBrandDto.slug && createBrandDto.slug.trim())
      || createBrandDto.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');

    const brand = await this.prisma.brand.create({
      data: {
        name: createBrandDto.name,
        slug,
        description: createBrandDto.description,
        website: createBrandDto.website,
        isActive: createBrandDto.isActive ?? true,
      },
    });

    return {
      id: brand.id.toString(),
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: null,
      logo: null,
      website: brand.website,
      isActive: brand.isActive,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }

  async findAll() {
    const brands = await this.prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const logoMap = await this.resolveLogoUrls(brands);

    return brands.map(brand => {
      const logoUrl = logoMap.get(brand.id) ?? null;
      return {
        id: brand.id.toString(),
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        logoUrl,
        logo: logoUrl,
        website: brand.website,
        isActive: brand.isActive,
        productCount: brand._count?.products || 0,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
      };
    });
  }

  async findOne(id: string) {
    const numId = Number.parseInt(id);
    if (isNaN(numId)) {
      throw new NotFoundException('Brand not found');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: numId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const logoMap = await this.resolveLogoUrls([brand]);
    const logoUrl = logoMap.get(brand.id) ?? null;

    return {
      id: brand.id.toString(),
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl,
      logo: logoUrl,
      website: brand.website,
      isActive: brand.isActive,
      productCount: brand._count?.products || 0,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const numId = Number.parseInt(id);
    if (isNaN(numId)) {
      throw new NotFoundException('Brand not found');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: numId },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Check name uniqueness if name is being updated
    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      const existing = await this.prisma.brand.findFirst({
        where: { name: updateBrandDto.name },
      });

      if (existing) {
        throw new ConflictException('Brand with this name already exists');
      }
    }

    const updated = await this.prisma.brand.update({
      where: { id: numId },
      data: {
        ...(updateBrandDto.name && { name: updateBrandDto.name }),
        ...(updateBrandDto.slug && { slug: updateBrandDto.slug }),
        ...(updateBrandDto.description !== undefined && { description: updateBrandDto.description }),
        ...(updateBrandDto.website !== undefined && { website: updateBrandDto.website }),
        ...(updateBrandDto.isActive !== undefined && { isActive: updateBrandDto.isActive }),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const logoMap = await this.resolveLogoUrls([updated]);
    const logoUrl = logoMap.get(updated.id) ?? null;

    return {
      id: updated.id.toString(),
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      logoUrl,
      logo: logoUrl,
      website: updated.website,
      isActive: updated.isActive,
      productCount: updated._count?.products || 0,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async remove(id: string) {
    const numId = Number.parseInt(id);
    if (isNaN(numId)) {
      throw new NotFoundException('Brand not found');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: numId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (brand._count.products > 0) {
      throw new ConflictException(
        'Cannot delete brand with associated products',
      );
    }

    await this.prisma.brand.delete({
      where: { id: numId },
    });

    return { message: 'Brand deleted successfully' };
  }
}
`;

// ─── categories.service.ts ───────────────────────────────────────────────────
const categoriesService = `import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly uploadsBaseUrl: string;

  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadsBaseUrl =
      this.configService.get<string>('UPLOAD_BASE_URL') ||
      this.configService.get<string>('APP_URL', 'http://localhost:3000') + '/uploads';
  }

  /**
   * Resolve image URLs for categories:
   * 1. Use image_id → media_assets if set
   * 2. Fall back to first product image for the category
   */
  private async resolveCategoryImageUrls(
    categories: Array<{ id: number; image_id: string | null }>,
  ): Promise<Map<number, string>> {
    const imageMap = new Map<number, string>();

    // Step 1: resolve existing image_id UUIDs from media_assets
    const withImage = categories.filter(c => c.image_id);
    if (withImage.length > 0) {
      const assets = await this.prisma.media_assets.findMany({
        where: { id: { in: withImage.map(c => c.image_id!) } },
        select: { id: true, key: true },
      });
      const urlMap = new Map(assets.map(a => [a.id, \`\${this.uploadsBaseUrl}/\${a.key}\`]));
      for (const c of withImage) {
        const url = urlMap.get(c.image_id!);
        if (url) imageMap.set(c.id, url);
      }
    }

    // Step 2: for categories still without an image, use the first product image
    const withoutImage = categories.filter(c => !imageMap.has(c.id));
    if (withoutImage.length > 0) {
      const catIds = withoutImage.map(c => c.id);
      const products = await this.prisma.product.findMany({
        where: { categoryId: { in: catIds }, isActive: true, images: { some: {} } },
        select: {
          categoryId: true,
          images: {
            orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
            take: 1,
            select: { media_asset_id: true },
          },
        },
        distinct: ['categoryId'],
      });

      const mediaIds = products
        .map(p => p.images[0]?.media_asset_id)
        .filter(Boolean) as string[];

      if (mediaIds.length > 0) {
        const assets = await this.prisma.media_assets.findMany({
          where: { id: { in: [...new Set(mediaIds)] } },
          select: { id: true, key: true },
        });
        const urlMap = new Map(assets.map(a => [a.id, \`\${this.uploadsBaseUrl}/\${a.key}\`]));
        for (const p of products) {
          const mediaId = p.images[0]?.media_asset_id;
          if (p.categoryId && mediaId) {
            const url = urlMap.get(mediaId);
            if (url) imageMap.set(p.categoryId, url);
          }
        }
      }
    }

    return imageMap;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    // Check if category slug already exists
    const slug = createCategoryDto.name.toLowerCase().replace(/\\s+/g, '-');
    const existing = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        slug,
        description: createCategoryDto.description,
        sort_order: createCategoryDto.displayOrder ?? 0,
        isActive: createCategoryDto.isActive ?? true,
        parent_id: createCategoryDto.parentId ? parseInt(String(createCategoryDto.parentId), 10) : null,
      },
    });
  }

  async findAll() {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
          include: {
            _count: { select: { products: { where: { isActive: true, stockQty: { gt: 0 } } } } },
          },
        },
        _count: { select: { products: { where: { isActive: true, stockQty: { gt: 0 } } } } },
      },
    });

    const imageMap = await this.resolveCategoryImageUrls(rows);
    return this.buildCategoryTree(rows, imageMap);
  }

  async getCategoriesTree() {
    return this.findAll();
  }

  async findOne(id: string) {
    const numericId = Number.parseInt(id, 10);

    // Look up by numeric ID or by slug
    const category = await this.prisma.category.findFirst({
      where: Number.isNaN(numericId) ? { slug: id } : { id: numericId },
      include: {
        other_categories: {
          where: { isActive: true },
          orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        },
        categories: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const imageMap = await this.resolveCategoryImageUrls([category]);
    const imageUrl = imageMap.get(category.id) ?? null;

    return {
      id: category.id,
      parent_id: category.parent_id,
      parent: category.categories ? {
        id: category.categories.id,
        name: category.categories.name,
        slug: category.categories.slug,
      } : null,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl,
      image_id: category.image_id,
      sort_order: category.sort_order,
      isActive: category.isActive,
      children: category.other_categories?.map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        sort_order: sub.sort_order,
        isActive: sub.isActive,
      })) || [],
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: numericId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check slug uniqueness if name is being updated
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const newSlug = updateCategoryDto.name.toLowerCase().replace(/\\s+/g, '-');
      const existing = await this.prisma.category.findUnique({
        where: { slug: newSlug },
      });

      if (existing && existing.id !== numericId) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id: numericId },
      data: {
        ...(updateCategoryDto.name && {
          name: updateCategoryDto.name,
          slug: updateCategoryDto.name.toLowerCase().replace(/\\s+/g, '-'),
        }),
        ...(updateCategoryDto.description !== undefined && { description: updateCategoryDto.description }),
        ...(updateCategoryDto.displayOrder !== undefined && { sort_order: updateCategoryDto.displayOrder }),
        ...(updateCategoryDto.isActive !== undefined && { isActive: updateCategoryDto.isActive }),
      },
      include: {
        other_categories: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      sort_order: updated.sort_order,
      isActive: updated.isActive,
      childrenCount: updated.other_categories?.length || 0,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async remove(id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: numericId },
      include: {
        other_categories: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.other_categories && category.other_categories.length > 0) {
      throw new ConflictException(
        'Cannot delete category with child categories. Delete children first.',
      );
    }

    await this.prisma.category.delete({
      where: { id: numericId },
    });

    return { message: 'Category deleted successfully' };
  }

  /**
   * Reorder categories by updating their sortOrder
   * @param orderedIds Array of category IDs in the desired order
   */
  async reorder(orderedIds: (string | number)[]) {
    if (!orderedIds || orderedIds.length === 0) {
      throw new BadRequestException('orderedIds array is required');
    }

    // Update all categories in a transaction
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.category.update({
          where: { id: typeof id === 'string' ? parseInt(id, 10) : id },
          data: { sort_order: index },
        })
      )
    );

    return { message: 'Categories reordered successfully', count: orderedIds.length };
  }

  private buildCategoryTree(rows: any[], imageMap?: Map<number, string>) {
    const map = new Map<number, any>();

    // prepare nodes
    for (const r of rows) {
      map.set(r.id, {
        id: r.id,
        name: r.name,
        name_ar: r.name_ar,
        slug: r.slug,
        description: r.description,
        imageUrl: imageMap?.get(r.id) ?? null,
        image_id: r.image_id,
        parent_id: r.parent_id,
        sort_order: r.sort_order,
        isActive: r.isActive,
        productCount: r._count?.products ?? 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        children: [],
        subcategories: (r.subcategories || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          name_ar: sub.name_ar,
          slug: sub.slug,
          description: sub.description,
          categoryId: sub.categoryId,
          sort_order: sub.sort_order,
          isActive: sub.isActive,
          productCount: sub._count?.products ?? 0,
        })),
      });
    }

    const roots: any[] = [];

    // link children to parents
    for (const r of rows) {
      const node = map.get(r.id);
      if (r.parent_id && map.has(r.parent_id)) {
        map.get(r.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    }

    // sort children arrays by sort_order then name
    const sortFn = (a: any, b: any) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.name).localeCompare(String(b.name));

    const sortTree = (nodes: any[]) => {
      nodes.sort(sortFn);
      for (const n of nodes) sortTree(n.children);
    };

    sortTree(roots);
    return roots;
  }
}
`;

fs.writeFileSync(
  path.join(__dirname, 'backend/src/brands/brands.service.ts'),
  brandsService,
  { encoding: 'utf8' }
);
console.log('✓ brands.service.ts written');

fs.writeFileSync(
  path.join(__dirname, 'backend/src/categories/categories.service.ts'),
  categoriesService,
  { encoding: 'utf8' }
);
console.log('✓ categories.service.ts written');
