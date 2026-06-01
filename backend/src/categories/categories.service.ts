import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Check if category slug already exists
    const slug = createCategoryDto.name.toLowerCase().replace(/\s+/g, '-');
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
        },
      },
    });

    // Compute accurate product counts that mirror the /products listing
    // filter logic (direct FK OR many-to-many link table), counted as
    // DISTINCT products. The Prisma `_count.products` relation only counts
    // the direct FK, which under-reports when products are linked via
    // product_subcategories or product_categories.
    const [subCounts, catCounts] = await Promise.all([
      this.prisma.$queryRaw<{ subcategory_id: number; cnt: bigint }[]>`
        SELECT s.id AS subcategory_id, COUNT(DISTINCT p.id)::bigint AS cnt
        FROM subcategories s
        LEFT JOIN products p
          ON (p.subcategory_id = s.id
              OR p.id IN (SELECT product_id FROM product_subcategories WHERE subcategory_id = s.id))
         AND p.is_active = true
        WHERE s.is_active = true
        GROUP BY s.id
      `,
      this.prisma.$queryRaw<{ category_id: number; cnt: bigint }[]>`
        SELECT c.id AS category_id, COUNT(DISTINCT p.id)::bigint AS cnt
        FROM categories c
        LEFT JOIN products p
          ON (p.category_id = c.id
              OR p.id IN (SELECT product_id FROM product_categories WHERE category_id = c.id))
         AND p.is_active = true
        WHERE c.is_active = true
        GROUP BY c.id
      `,
    ]);

    const subCountMap = new Map<number, number>(
      subCounts.map((r) => [r.subcategory_id, Number(r.cnt)]),
    );
    const catCountMap = new Map<number, number>(
      catCounts.map((r) => [r.category_id, Number(r.cnt)]),
    );

    for (const row of rows as any[]) {
      row._productCount = catCountMap.get(row.id) ?? 0;
      for (const sub of row.subcategories || []) {
        sub._productCount = subCountMap.get(sub.id) ?? 0;
      }
    }

    return this.buildCategoryTree(rows);
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
      const newSlug = updateCategoryDto.name.toLowerCase().replace(/\s+/g, '-');
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
          slug: updateCategoryDto.name.toLowerCase().replace(/\s+/g, '-'),
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

  private buildCategoryTree(rows: any[]) {
    const map = new Map<number, any>();

    // prepare nodes
    for (const r of rows) {
      map.set(r.id, {
        id: r.id,
        name: r.name,
        name_ar: r.name_ar,
        slug: r.slug,
        description: r.description,
        image_id: r.image_id,
        parent_id: r.parent_id,
        sort_order: r.sort_order,
        isActive: r.isActive,
        productCount: r._productCount ?? r._count?.products ?? 0,
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
          productCount: sub._productCount ?? sub._count?.products ?? 0,
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
