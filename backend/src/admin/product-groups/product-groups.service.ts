import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateGroupDto {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  tags?: string[];
  variantAxes?: string[];
  productIds?: number[];
}

interface UpdateGroupDto {
  name?: string;
  slug?: string;
  description?: string;
  category?: string;
  tags?: string[];
  variantAxes?: string[];
  productIds?: number[];
}

interface AttributeInput {
  key: string;
  value: string;
  colorHex?: string | null;
}

interface AddVariantDto {
  productId: number;
  attributes?: AttributeInput[];
  isDefault?: boolean;
  variantSortOrder?: number;
}

interface SetProductVariantDto {
  productGroupId: string | null;
  variantAttributes?: Record<string, any> | null;
  variantSortOrder?: number;
}

interface AutoGroupDto {
  skus: string[];
  groupName: string;
  slug?: string;
  category?: string;
  variantAxes?: string[];
}

const KNOWN_COLORS = new Set([
  'red', 'blue', 'green', 'black', 'white', 'grey', 'gray', 'silver', 'gold',
  'pink', 'purple', 'violet', 'orange', 'yellow', 'brown', 'beige', 'cream',
  'navy', 'teal', 'turquoise', 'cyan', 'maroon', 'ruby', 'emerald', 'sapphire',
  'ivory', 'charcoal', 'olive', 'mint', 'rose', 'coral', 'amber', 'bronze',
  'copper', 'platinum', 'pearl', 'midnight', 'sky', 'dusty',
]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _KNOWN_COLORS_RESERVED = KNOWN_COLORS;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function attributesToJson(attrs: AttributeInput[] | undefined): Record<string, any> | null {
  if (!attrs || attrs.length === 0) return null;
  const out: Record<string, any> = {};
  for (const a of attrs) {
    if (!a.key || a.value == null || a.value === '') continue;
    const k = a.key.toLowerCase();
    out[k] = a.value;
    if ((k === 'color' || k === 'colorname') && a.colorHex) {
      out.colorHex = a.colorHex;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

@Injectable()
export class ProductGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────

  private readonly variantInclude = {
    products: {
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        slug: true,
        productName: true,
        variantAttributes: true,
        variantSortOrder: true,
        isDefaultVariant: true,
        stockQty: true,
        variantAttrs: {
          select: { id: true, key: true, value: true, colorHex: true },
          orderBy: { key: 'asc' as const },
        },
      },
      orderBy: [
        { isDefaultVariant: 'desc' as const },
        { variantSortOrder: 'asc' as const },
        { id: 'asc' as const },
      ],
    },
  };

  private async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    let candidate = slug;
    let suffix = 1;
    while (true) {
      const existing = await (this.prisma as any).productGroup.findUnique({ where: { slug: candidate } });
      if (!existing || existing.id === excludeId) return candidate;
      suffix += 1;
      candidate = `${slug}-${suffix}`;
    }
  }

  /** Replace a product's relational variant attribute rows AND mirror the JSON cache. */
  private async replaceProductAttributes(productId: number, attrs: AttributeInput[] | undefined) {
    await (this.prisma as any).variantAttribute.deleteMany({ where: { productId } });
    if (attrs && attrs.length > 0) {
      const byKey = new Map<string, AttributeInput & { productId: number }>();
      for (const a of attrs) {
        if (!a.key || a.value == null || a.value === '') continue;
        const k = a.key.toLowerCase();
        byKey.set(k, { productId, key: k, value: String(a.value), colorHex: a.colorHex ?? null });
      }
      const finalRows = Array.from(byKey.values());
      if (finalRows.length > 0) {
        await (this.prisma as any).variantAttribute.createMany({ data: finalRows });
      }
    }
    await this.prisma.product.update({
      where: { id: productId },
      data: { variantAttributes: attributesToJson(attrs) ?? undefined },
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // Group CRUD
  // ─────────────────────────────────────────────────────────────────────

  async list() {
    const groups = await (this.prisma as any).productGroup.findMany({
      include: this.variantInclude,
      orderBy: { createdAt: 'desc' },
    });
    return { data: groups, count: groups.length };
  }

  async findOne(id: string) {
    const group = await (this.prisma as any).productGroup.findUnique({
      where: { id },
      include: this.variantInclude,
    });
    if (!group) throw new NotFoundException('Product group not found');
    return group;
  }

  async findBySlug(slug: string) {
    const group = await (this.prisma as any).productGroup.findUnique({
      where: { slug },
      include: this.variantInclude,
    });
    if (!group) throw new NotFoundException('Product group not found');
    return group;
  }

  async create(dto: CreateGroupDto) {
    if (!dto.name?.trim()) throw new BadRequestException('Group name required');
    const baseSlug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.name);
    const slug = await this.ensureUniqueSlug(baseSlug);
    const group = await (this.prisma as any).productGroup.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description ?? null,
        category: dto.category ?? null,
        tags: dto.tags ?? [],
        variantAxes: dto.variantAxes ?? ['color'],
      },
    });
    if (dto.productIds && dto.productIds.length > 0) {
      await this.prisma.product.updateMany({
        where: { id: { in: dto.productIds } },
        data: { productGroupId: group.id },
      });
      await this.ensureSingleDefault(group.id);
    }
    return this.findOne(group.id);
  }

  async update(id: string, dto: UpdateGroupDto) {
    const existing = await (this.prisma as any).productGroup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product group not found');
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.variantAxes !== undefined) data.variantAxes = dto.variantAxes;
    if (dto.slug !== undefined && dto.slug.trim() && dto.slug !== existing.slug) {
      data.slug = await this.ensureUniqueSlug(slugify(dto.slug), id);
    }
    await (this.prisma as any).productGroup.update({ where: { id }, data });
    if (dto.productIds !== undefined) {
      await this.prisma.product.updateMany({
        where: { productGroupId: id, id: { notIn: dto.productIds } },
        data: { productGroupId: null, isDefaultVariant: false },
      });
      if (dto.productIds.length > 0) {
        await this.prisma.product.updateMany({
          where: { id: { in: dto.productIds } },
          data: { productGroupId: id },
        });
      }
      await this.ensureSingleDefault(id);
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    const existing = await (this.prisma as any).productGroup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product group not found');
    await this.prisma.product.updateMany({
      where: { productGroupId: id },
      data: { productGroupId: null, isDefaultVariant: false },
    });
    await (this.prisma as any).productGroup.delete({ where: { id } });
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────────
  // Variant operations
  // ─────────────────────────────────────────────────────────────────────

  async addVariant(groupId: string, dto: AddVariantDto) {
    const group = await (this.prisma as any).productGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Product group not found');
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.product.update({
      where: { id: dto.productId },
      data: {
        productGroupId: groupId,
        ...(dto.variantSortOrder !== undefined ? { variantSortOrder: dto.variantSortOrder } : {}),
      },
    });
    await this.replaceProductAttributes(dto.productId, dto.attributes);

    if (dto.isDefault) {
      await this.setDefault(groupId, dto.productId);
    } else {
      await this.ensureSingleDefault(groupId);
    }
    return this.findOne(groupId);
  }

  async removeVariant(groupId: string, productId: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.productGroupId !== groupId) {
      throw new BadRequestException('Product not in this group');
    }
    await this.replaceProductAttributes(productId, []);
    await this.prisma.product.update({
      where: { id: productId },
      data: { productGroupId: null, isDefaultVariant: false, variantAttributes: undefined },
    });
    await this.ensureSingleDefault(groupId);
    return this.findOne(groupId);
  }

  async setDefault(groupId: string, productId: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.productGroupId !== groupId) {
      throw new BadRequestException('Product not in this group');
    }
    await this.prisma.$transaction([
      this.prisma.product.updateMany({
        where: { productGroupId: groupId },
        data: { isDefaultVariant: false },
      }),
      this.prisma.product.update({
        where: { id: productId },
        data: { isDefaultVariant: true },
      }),
    ]);
    return this.findOne(groupId);
  }

  /** Make sure exactly one product in the group is marked default. */
  private async ensureSingleDefault(groupId: string) {
    const members = await this.prisma.product.findMany({
      where: { productGroupId: groupId },
      select: { id: true, isDefaultVariant: true, variantSortOrder: true },
      orderBy: [{ variantSortOrder: 'asc' }, { id: 'asc' }],
    });
    if (members.length === 0) return;
    const defaults = members.filter(m => m.isDefaultVariant);
    if (defaults.length === 1) return;
    if (defaults.length === 0) {
      await this.prisma.product.update({
        where: { id: members[0].id },
        data: { isDefaultVariant: true },
      });
    } else {
      const keep = defaults[0].id;
      await this.prisma.product.updateMany({
        where: { productGroupId: groupId, id: { not: keep } },
        data: { isDefaultVariant: false },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Bulk auto-group
  // ─────────────────────────────────────────────────────────────────────

  async autoGroup(dto: AutoGroupDto) {
    if (!dto.skus?.length) throw new BadRequestException('skus required');
    if (!dto.groupName?.trim()) throw new BadRequestException('groupName required');

    const products = await this.prisma.product.findMany({
      where: { sku: { in: dto.skus } },
      select: { id: true, sku: true, productName: true, colour: true, size: true },
    });
    if (products.length === 0) throw new NotFoundException('No matching products found');

    const baseSlug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.groupName);
    const slug = await this.ensureUniqueSlug(baseSlug);
    const group = await (this.prisma as any).productGroup.create({
      data: {
        name: dto.groupName.trim(),
        slug,
        category: dto.category ?? null,
        variantAxes: dto.variantAxes ?? ['color'],
      },
    });

    await this.prisma.product.updateMany({
      where: { id: { in: products.map(p => p.id) } },
      data: { productGroupId: group.id },
    });

    for (const p of products) {
      const attrs: AttributeInput[] = [];
      if (p.colour) attrs.push({ key: 'color', value: p.colour });
      if (p.size) attrs.push({ key: 'size', value: p.size });
      if (attrs.length > 0) {
        await this.replaceProductAttributes(p.id, attrs);
      }
    }
    await this.ensureSingleDefault(group.id);
    return this.findOne(group.id);
  }

  /**
   * Migration helper: scan products that have a `colour` and/or `size`,
   * normalize the product name by stripping those tokens, and group products
   * that share the same normalized base + category. Returns a summary.
   *
   * Requirements for a bucket to become a group:
   *   - 2+ products share the same (categoryId, baseName)
   *   - At least one variant axis (color or size) actually varies across them.
   */
  async autoGroupByName(dryRun = false) {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, productGroupId: null },
      select: {
        id: true,
        sku: true,
        productName: true,
        colour: true,
        size: true,
        categoryId: true,
      },
    });

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const normalize = (s: string) =>
      s.replace(/[\s_\-–|,]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const computeBase = (name: string, colour?: string | null, size?: string | null) => {
      let base = name;
      if (colour) base = base.replace(new RegExp(escapeRegex(colour), 'gi'), ' ');
      if (size) base = base.replace(new RegExp(escapeRegex(size), 'gi'), ' ');
      return normalize(base);
    };

    type Bucket = {
      baseDisplay: string;
      categoryId: number | null;
      variants: typeof products;
    };
    const buckets = new Map<string, Bucket>();
    for (const p of products) {
      if (!p.colour && !p.size) continue;
      const base = computeBase(p.productName, p.colour, p.size);
      if (!base || base.length < 3) continue;
      const key = `${p.categoryId ?? 'x'}::${base}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        // Use the first product's "display base" — original name with its
        // own colour/size stripped — for human readability.
        let display = p.productName;
        if (p.colour) display = display.replace(new RegExp(escapeRegex(p.colour), 'gi'), ' ');
        if (p.size) display = display.replace(new RegExp(escapeRegex(p.size), 'gi'), ' ');
        display = display.replace(/[\s_\-–|,]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (!display) display = p.productName;
        bucket = { baseDisplay: display, categoryId: p.categoryId, variants: [] };
        buckets.set(key, bucket);
      }
      bucket.variants.push(p);
    }

    let groupsCreated = 0;
    let productsLinked = 0;
    const skipped: string[] = [];

    for (const { baseDisplay, variants } of buckets.values()) {
      if (variants.length < 2) {
        skipped.push(baseDisplay);
        continue;
      }
      const colours = new Set(variants.map(v => v.colour ?? '').filter(Boolean));
      const sizes = new Set(variants.map(v => v.size ?? '').filter(Boolean));
      if (colours.size < 2 && sizes.size < 2) {
        skipped.push(baseDisplay);
        continue;
      }

      const variantAxes: string[] = [];
      if (colours.size >= 2) variantAxes.push('color');
      if (sizes.size >= 2) variantAxes.push('size');

      if (dryRun) {
        groupsCreated += 1;
        productsLinked += variants.length;
        continue;
      }

      const slug = await this.ensureUniqueSlug(slugify(baseDisplay));
      const group = await (this.prisma as any).productGroup.create({
        data: { name: baseDisplay, slug, variantAxes },
      });
      groupsCreated += 1;

      for (const v of variants) {
        const attrs: AttributeInput[] = [];
        if (v.colour) attrs.push({ key: 'color', value: v.colour });
        if (v.size) attrs.push({ key: 'size', value: v.size });
        await this.prisma.product.update({
          where: { id: v.id },
          data: { productGroupId: group.id },
        });
        if (attrs.length > 0) {
          await this.replaceProductAttributes(v.id, attrs);
        }
        productsLinked += 1;
      }
      await this.ensureSingleDefault(group.id);
    }

    return {
      groupsCreated,
      productsLinked,
      ungroupedProducts: products.length - productsLinked,
      skippedBaseNames: skipped,
      dryRun,
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // Backward-compat (used by existing admin Variants tab UI)
  // ─────────────────────────────────────────────────────────────────────

  async setProductVariant(productId: number, dto: SetProductVariantDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (dto.productGroupId) {
      const group = await (this.prisma as any).productGroup.findUnique({ where: { id: dto.productGroupId } });
      if (!group) throw new NotFoundException('Product group not found');
    }
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        productGroupId: dto.productGroupId,
        ...(dto.variantSortOrder !== undefined ? { variantSortOrder: dto.variantSortOrder } : {}),
      },
    });

    if (dto.variantAttributes !== undefined) {
      const json = (dto.variantAttributes ?? {}) as Record<string, any>;
      const attrs: AttributeInput[] = [];
      for (const [k, v] of Object.entries(json)) {
        if (k === 'colorHex') continue;
        if (v == null || v === '') continue;
        const key = k.toLowerCase();
        const colorHex = (key === 'color' || key === 'colorname')
          ? (json.colorHex as string | undefined)
          : undefined;
        attrs.push({ key, value: String(v), colorHex });
      }
      await this.replaceProductAttributes(productId, attrs);
    }

    if (dto.productGroupId) {
      await this.ensureSingleDefault(dto.productGroupId);
    } else {
      await this.prisma.product.update({
        where: { id: productId },
        data: { isDefaultVariant: false },
      });
    }
    return { success: true };
  }
}
