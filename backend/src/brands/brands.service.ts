import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const logoUrl = createBrandDto.logoUrl || createBrandDto.logo || null;
    const brand = await this.prisma.brand.create({
      data: {
        name: createBrandDto.name,
        slug,
        description: createBrandDto.description,
        logoUrl,
        website: createBrandDto.website,
        isActive: createBrandDto.isActive ?? true,
      },
    });

    return {
      id: brand.id.toString(),
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logoUrl,
      logo: brand.logoUrl,
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

    // Transform to API format
    return brands.map(brand => ({
      id: brand.id.toString(),
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logoUrl,
      logo: brand.logoUrl,
      website: brand.website,
      isActive: brand.isActive,
      productCount: brand._count?.products || 0,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));
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

    return {
      id: brand.id.toString(),
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logoUrl,
      logo: brand.logoUrl,
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

    const incomingLogo = updateBrandDto.logoUrl !== undefined
      ? updateBrandDto.logoUrl
      : updateBrandDto.logo;

    const updated = await this.prisma.brand.update({
      where: { id: numId },
      data: {
        ...(updateBrandDto.name && { name: updateBrandDto.name }),
        ...(updateBrandDto.slug && { slug: updateBrandDto.slug }),
        ...(updateBrandDto.description !== undefined && { description: updateBrandDto.description }),
        ...(incomingLogo !== undefined && { logoUrl: incomingLogo || null }),
        ...(updateBrandDto.website !== undefined && { website: updateBrandDto.website }),
        ...(updateBrandDto.isActive !== undefined && { isActive: updateBrandDto.isActive }),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      id: updated.id.toString(),
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      logoUrl: updated.logoUrl,
      logo: updated.logoUrl,
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
