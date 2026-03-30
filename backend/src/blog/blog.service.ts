import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto, UpdateBlogPostDto, CreateBlogCategoryDto, UpdateBlogCategoryDto, CreateBlogTagDto } from './dto';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // BLOG POSTS
  // ============================================================================

  async getAllPosts(options?: {
    categoryId?: string;
    tagId?: string;
    isFeatured?: boolean;
    limit?: number;
    page?: number;
    includeInactive?: boolean;
  }) {
    const { categoryId, tagId, isFeatured, limit = 10, page = 1, includeInactive = false } = options || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
      where.publishedAt = { lte: new Date() };
    }
    if (categoryId) where.categoryId = categoryId;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (tagId) {
      where.tags = { some: { tagId } };
    }

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      items: posts.map(post => ({
        ...post,
        tags: post.tags.map(pt => pt.tag),
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getPostBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!post) {
      throw new NotFoundException(`Blog post with slug "${slug}" not found`);
    }

    return {
      ...post,
      tags: post.tags.map(pt => pt.tag),
    };
  }

  async getPost(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!post) {
      throw new NotFoundException(`Blog post with ID "${id}" not found`);
    }

    return {
      ...post,
      tags: post.tags.map(pt => pt.tag),
    };
  }

  async createPost(dto: CreateBlogPostDto) {
    // Check if slug exists
    const existing = await this.prisma.blogPost.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Blog post with slug "${dto.slug}" already exists`);
    }

    // Validate category
    const category = await this.prisma.blogCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException(`Blog category with ID "${dto.categoryId}" not found`);
    }

    const post = await this.prisma.blogPost.create({
      data: {
        categoryId: dto.categoryId,
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        content: dto.content,
        featuredImage: dto.featuredImage,
        author: dto.author,
        readTimeMinutes: dto.readTimeMinutes,
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    // Add tags if provided
    if (dto.tagIds?.length) {
      await this.prisma.blogPostTag.createMany({
        data: dto.tagIds.map(tagId => ({ postId: post.id, tagId })),
      });
    }

    return this.getPost(post.id);
  }

  async updatePost(id: string, dto: UpdateBlogPostDto) {
    await this.getPost(id);

    // Check if new slug exists
    if (dto.slug) {
      const existing = await this.prisma.blogPost.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Blog post with slug "${dto.slug}" already exists`);
      }
    }

    // Validate category if changed
    if (dto.categoryId) {
      const category = await this.prisma.blogCategory.findUnique({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException(`Blog category with ID "${dto.categoryId}" not found`);
      }
    }

    // Update tags if provided
    if (dto.tagIds !== undefined) {
      await this.prisma.blogPostTag.deleteMany({ where: { postId: id } });
      if (dto.tagIds.length) {
        await this.prisma.blogPostTag.createMany({
          data: dto.tagIds.map(tagId => ({ postId: id, tagId })),
        });
      }
    }

    await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.title && { title: dto.title }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(dto.content && { content: dto.content }),
        ...(dto.featuredImage !== undefined && { featuredImage: dto.featuredImage }),
        ...(dto.author !== undefined && { author: dto.author }),
        ...(dto.readTimeMinutes !== undefined && { readTimeMinutes: dto.readTimeMinutes }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.publishedAt !== undefined && { publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null }),
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle }),
        ...(dto.metaDescription !== undefined && { metaDescription: dto.metaDescription }),
      },
    });

    return this.getPost(id);
  }

  async deletePost(id: string) {
    await this.getPost(id);
    return this.prisma.blogPost.delete({ where: { id } });
  }

  async getRecentPosts(limit = 5) {
    return this.prisma.blogPost.findMany({
      where: {
        isActive: true,
        publishedAt: { lte: new Date() },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
        publishedAt: true,
      },
    });
  }

  // ============================================================================
  // BLOG SIDEBAR DATA
  // ============================================================================

  async getSidebarData() {
    const [categories, recentPosts, archive] = await Promise.all([
      // Categories with post count
      this.prisma.blogCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { posts: { where: { isActive: true } } } },
        },
      }),
      // Recent posts
      this.getRecentPosts(5),
      // Archive (posts grouped by month)
      this.prisma.$queryRaw<Array<{ month: string; count: number }>>`
        SELECT 
          TO_CHAR(published_at, 'YYYY-MM') as month,
          COUNT(*)::int as count
        FROM blog_posts
        WHERE is_active = true AND published_at <= NOW()
        GROUP BY TO_CHAR(published_at, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `,
    ]);

    return {
      categories: categories.map(c => ({ ...c, postCount: c._count.posts })),
      recentPosts,
      archive,
    };
  }

  // ============================================================================
  // BLOG CATEGORIES
  // ============================================================================

  async getAllCategories() {
    return this.prisma.blogCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { posts: true } },
      },
    });
  }

  async getCategory(id: string) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Blog category with ID "${id}" not found`);
    }

    return category;
  }

  async createCategory(dto: CreateBlogCategoryDto) {
    const existing = await this.prisma.blogCategory.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Blog category with slug "${dto.slug}" already exists`);
    }

    return this.prisma.blogCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        image: dto.image,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateBlogCategoryDto) {
    await this.getCategory(id);

    if (dto.slug) {
      const existing = await this.prisma.blogCategory.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Blog category with slug "${dto.slug}" already exists`);
      }
    }

    return this.prisma.blogCategory.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.image !== undefined && { image: dto.image }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.getCategory(id);
    if (category._count.posts > 0) {
      throw new ConflictException(`Cannot delete category with ${category._count.posts} posts`);
    }
    return this.prisma.blogCategory.delete({ where: { id } });
  }

  // ============================================================================
  // BLOG TAGS
  // ============================================================================

  async getAllTags() {
    return this.prisma.blogTag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { posts: true } },
      },
    });
  }

  async getTag(id: string) {
    const tag = await this.prisma.blogTag.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true } },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Blog tag with ID "${id}" not found`);
    }

    return tag;
  }

  async createTag(dto: CreateBlogTagDto) {
    const existing = await this.prisma.blogTag.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Blog tag with slug "${dto.slug}" already exists`);
    }

    return this.prisma.blogTag.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async deleteTag(id: string) {
    await this.getTag(id);
    return this.prisma.blogTag.delete({ where: { id } });
  }
}
