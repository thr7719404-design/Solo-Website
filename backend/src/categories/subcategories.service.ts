import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateSubcategoryInput {
  categoryId: number | string;
  name: string;
  name_ar?: string | null;
  slug?: string;
  description?: string | null;
  sort_order?: number;
  isActive?: boolean;
}

export interface UpdateSubcategoryInput {
  categoryId?: number | string;
  name?: string;
  name_ar?: string | null;
  slug?: string;
  description?: string | null;
  sort_order?: number;
  isActive?: boolean;
}

function slugify(value: string): string {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

function toNumericId(id: string | number, label = 'id'): number {
  const n = typeof id === 'number' ? id : Number.parseInt(id, 10);
  if (Number.isNaN(n)) throw new BadRequestException(`Invalid ${label}`);
  return n;
}

@Injectable()
export class SubcategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Computes accurate active-product counts that mirror the /products listing
  // filter (direct subcategory_id FK OR product_subcategories m2m link).
  private async hydrateCounts(rows: any[]): Promise<any[]> {
    if (rows.length === 0) return rows;
    const ids = rows.map((r) => r.id);
    const counts = await this.prisma.$queryRaw<{ subcategory_id: number; cnt: bigint }[]>`
      SELECT s.id AS subcategory_id, COUNT(DISTINCT p.id)::bigint AS cnt
      FROM subcategories s
      LEFT JOIN products p
        ON (p.subcategory_id = s.id
            OR p.id IN (SELECT product_id FROM product_subcategories WHERE subcategory_id = s.id))
       AND p.is_active = true
      WHERE s.id IN (${Prisma.join(ids)})
      GROUP BY s.id
    `;
    const map = new Map<number, number>(counts.map((c) => [c.subcategory_id, Number(c.cnt)]));
    for (const r of rows) {
      r._productCount = map.get(r.id) ?? 0;
    }
    return rows;
  }

  async list(categoryId?: string | number | null) {
    const where: any = {};
    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      where.categoryId = toNumericId(categoryId, 'categoryId');
    }
    const rows = await this.prisma.subcategory.findMany({
      where,
      orderBy: [{ categoryId: 'asc' }, { sort_order: 'asc' }, { name: 'asc' }],
    });
    await this.hydrateCounts(rows);
    return rows.map((r) => this.toDto(r));
  }

  async listForCategory(categoryId: string | number) {
    const cid = toNumericId(categoryId, 'categoryId');
    const rows = await this.prisma.subcategory.findMany({
      where: { categoryId: cid },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });
    await this.hydrateCounts(rows);
    return rows.map((r) => this.toDto(r));
  }

  async findOne(id: string | number) {
    const sid = toNumericId(id, 'subcategoryId');
    const row = await this.prisma.subcategory.findUnique({
      where: { id: sid },
    });
    if (!row) throw new NotFoundException('Subcategory not found');
    await this.hydrateCounts([row]);
    return this.toDto(row);
  }

  async create(input: CreateSubcategoryInput) {
    if (!input.name?.trim()) {
      throw new BadRequestException('name is required');
    }
    const cid = toNumericId(input.categoryId, 'categoryId');

    const category = await this.prisma.category.findUnique({ where: { id: cid } });
    if (!category) throw new NotFoundException('Category not found');

    const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);

    // Uniqueness checks (categoryId, slug) and (categoryId, name)
    const dupSlug = await this.prisma.subcategory.findFirst({
      where: { categoryId: cid, slug },
    });
    if (dupSlug) throw new ConflictException('Subcategory slug already exists in this category');

    const dupName = await this.prisma.subcategory.findFirst({
      where: { categoryId: cid, name: input.name.trim() },
    });
    if (dupName) throw new ConflictException('Subcategory name already exists in this category');

    const created = await this.prisma.subcategory.create({
      data: {
        categoryId: cid,
        name: input.name.trim(),
        name_ar: input.name_ar ?? null,
        slug,
        description: input.description ?? null,
        sort_order: input.sort_order ?? 0,
        isActive: input.isActive ?? true,
      },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    return this.toDto(created);
  }

  async update(id: string | number, input: UpdateSubcategoryInput) {
    const sid = toNumericId(id, 'subcategoryId');
    const existing = await this.prisma.subcategory.findUnique({ where: { id: sid } });
    if (!existing) throw new NotFoundException('Subcategory not found');

    const data: any = {};

    // Handle parent category change
    let effectiveCategoryId = existing.categoryId;
    if (input.categoryId !== undefined) {
      const cid = toNumericId(input.categoryId, 'categoryId');
      const category = await this.prisma.category.findUnique({ where: { id: cid } });
      if (!category) throw new NotFoundException('Category not found');
      data.categoryId = cid;
      effectiveCategoryId = cid;
    }

    if (input.name !== undefined) {
      if (!input.name.trim()) throw new BadRequestException('name cannot be empty');
      data.name = input.name.trim();
      // name uniqueness in effective category
      const dupName = await this.prisma.subcategory.findFirst({
        where: { categoryId: effectiveCategoryId, name: data.name, NOT: { id: sid } },
      });
      if (dupName) throw new ConflictException('Subcategory name already exists in this category');
    }
    if (input.slug !== undefined) {
      const slug = slugify(input.slug);
      if (!slug) throw new BadRequestException('slug cannot be empty');
      data.slug = slug;
      const dupSlug = await this.prisma.subcategory.findFirst({
        where: { categoryId: effectiveCategoryId, slug, NOT: { id: sid } },
      });
      if (dupSlug) throw new ConflictException('Subcategory slug already exists in this category');
    }
    if (input.name_ar !== undefined) data.name_ar = input.name_ar;
    if (input.description !== undefined) data.description = input.description;
    if (input.sort_order !== undefined) data.sort_order = input.sort_order;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const updated = await this.prisma.subcategory.update({
      where: { id: sid },
      data,
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    return this.toDto(updated);
  }

  async remove(id: string | number) {
    const sid = toNumericId(id, 'subcategoryId');
    const existing = await this.prisma.subcategory.findUnique({
      where: { id: sid },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) throw new NotFoundException('Subcategory not found');

    // Detach products from this subcategory (set NULL) before delete to keep them visible.
    await this.prisma.$transaction([
      this.prisma.product.updateMany({
        where: { subcategoryId: sid },
        data: { subcategoryId: null },
      }),
      this.prisma.subcategory.delete({ where: { id: sid } }),
    ]);
    return {
      message: 'Subcategory deleted; products were unlinked',
      detachedProducts: existing._count.products,
    };
  }

  async reorder(categoryId: string | number, orderedIds: Array<string | number>) {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new BadRequestException('orderedIds array is required');
    }
    const cid = toNumericId(categoryId, 'categoryId');
    const ids = orderedIds.map((i) => toNumericId(i, 'subcategoryId'));

    // Verify all belong to this category
    const rows = await this.prisma.subcategory.findMany({
      where: { id: { in: ids } },
      select: { id: true, categoryId: true },
    });
    if (rows.length !== ids.length || rows.some((r) => r.categoryId !== cid)) {
      throw new BadRequestException('One or more subcategories do not belong to this category');
    }

    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.subcategory.update({
          where: { id },
          data: { sort_order: index },
        }),
      ),
    );
    return { message: 'Subcategories reordered', count: ids.length };
  }

  private toDto(row: any) {
    return {
      id: row.id,
      categoryId: row.categoryId,
      name: row.name,
      name_ar: row.name_ar,
      slug: row.slug,
      description: row.description,
      imageUrl: row.imageUrl,
      image: row.imageUrl,
      sort_order: row.sort_order,
      isActive: row.isActive,
      productCount: row._productCount ?? row._count?.products ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
