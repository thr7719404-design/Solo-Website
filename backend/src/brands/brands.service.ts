import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  /** Resolve a media_asset_id value to a full URL.
   *  - If it starts with 'http', it is already a URL.
   *  - If it contains '/', it is a relative path (prepend base).
   *  - Otherwise, treat as a UUID and look up in media_assets table.
   */
  private resolveMediaId(mediaId: string, assetKeyMap: Map<string, string>): string | null {
    if (!mediaId) return null;
    if (mediaId.startsWith('http')) return mediaId;
    if (mediaId.includes('/')) return `${this.uploadsBaseUrl}/${mediaId}`;
    return assetKeyMap.get(mediaId) ?? null;
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
      const assetKeyMap = new Map(assets.map(a => [a.id, `${this.uploadsBaseUrl}/${a.key}`]));
      for (const b of withLogo) {
        const url = this.resolveMediaId(b.logo_id!, assetKeyMap);
        if (url) logoMap.set(b.id, url);
      }
    }

    // Step 2: for brands still without a logo, use the first product image
    const withoutLogo = brands.filter(b => !logoMap.has(b.id));
    if (withoutLogo.length > 0) {
      const brandIds = withoutLogo.map(b => b.id);

      // Fetch products for those brands (ordered so we can pick one per brand)
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
        orderBy: { id: 'asc' },
      });

      // Manually take first product per brand
      const brandFirstMediaId = new Map<number, string>();
      for (const p of products) {
        const mediaId = p.images[0]?.media_asset_id;
        if (p.brandId && mediaId && !brandFirstMediaId.has(p.brandId)) {
          brandFirstMediaId.set(p.brandId, mediaId);
        }
      }

      if (brandFirstMediaId.size > 0) {
        // Collect UUIDs that need lookup (not direct URLs or paths)
        const uuids = [...brandFirstMediaId.values()].filter(
          m => !m.startsWith('http') && !m.includes('/'),
        );
        const assetKeyMap = new Map<string, string>();
        if (uuids.length > 0) {
          const assets = await this.prisma.media_assets.findMany({
            where: { id: { in: [...new Set(uuids)] } },
            select: { id: true, key: true },
          });
          for (const a of assets) {
            assetKeyMap.set(a.id, `${this.uploadsBaseUrl}/${a.key}`);
          }
        }

        for (const [brandId, mediaId] of brandFirstMediaId) {
          const url = this.resolveMediaId(mediaId, assetKeyMap);
          if (url) logoMap.set(brandId, url);
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

    // Prefer direct logo_url column; fall back to resolving via logo_id / product images
    const brandsNeedingFallback = brands.filter(b => !b.logoUrl);
    const fallbackMap = brandsNeedingFallback.length > 0
      ? await this.resolveLogoUrls(brandsNeedingFallback)
      : new Map<number, string>();

    return brands.map(brand => {
      const logoUrl = brand.logoUrl ?? fallbackMap.get(brand.id) ?? null;
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

    const resolvedLogoUrl = brand.logoUrl
      ?? (await this.resolveLogoUrls([brand])).get(brand.id)
      ?? null;

    return {
      id: brand.id.toString(),
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: resolvedLogoUrl,
      logo: resolvedLogoUrl,
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

    const resolvedLogoUrl = updated.logoUrl
      ?? (await this.resolveLogoUrls([updated])).get(updated.id)
      ?? null;

    return {
      id: updated.id.toString(),
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      logoUrl: resolvedLogoUrl,
      logo: resolvedLogoUrl,
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
