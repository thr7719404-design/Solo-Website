import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto, BannerPlacement } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { CreateLandingSectionDto } from './dto/create-landing-section.dto';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';
import { UpdateLoyaltyConfigDto, LoyaltyConfigResponseDto } from './dto/loyalty-config.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // HOME PAGE METHODS
  // ============================================================================

  /**
   * Get the homepage layout with all active sections
   * This is a convenience method that fetches the landing page with slug "home"
   */
  async getHomePage() {
    console.log('[ContentService] Fetching homepage with slug: home');
    
    const page = await this.prisma.landingPage.findUnique({
      where: { slug: 'home' },
      include: {
        heroBanner: true,
        sections: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    console.log('[ContentService] Homepage query result:', {
      found: !!page,
      id: page?.id,
      title: page?.title,
      isActive: page?.isActive,
      sectionsCount: page?.sections?.length || 0,
    });

    if (!page) {
      // Return empty structure if home page doesn't exist yet
      console.log('[ContentService] No homepage found - returning empty structure');
      return {
        id: null,
        slug: 'home',
        title: 'Home',
        isActive: false,
        sections: [],
        heroBanner: null,
      };
    }

    // Ensure category tiles section exists (idempotent seed)
    await this.ensureCategoryTilesSection(page.id);

    // Refetch page with updated sections
    return this.prisma.landingPage.findUnique({
      where: { slug: 'home' },
      include: {
        heroBanner: true,
        sections: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Ensures the home page has a CATEGORY_TILES section with default tiles
   * This is idempotent - only creates if it doesn't exist
   */
  private async ensureCategoryTilesSection(homePageId: string) {
    // Check if CATEGORY_TILES section already exists
    const existingSection = await this.prisma.landingSection.findFirst({
      where: {
        landingPageId: homePageId,
        type: 'CATEGORY_TILES',
      },
    });

    if (existingSection) {
      console.log('[ContentService] CATEGORY_TILES section already exists, skipping seed');
      return;
    }

    console.log('[ContentService] Creating default CATEGORY_TILES section...');

    // Get the highest display order to append at the end
    const lastSection = await this.prisma.landingSection.findFirst({
      where: { landingPageId: homePageId },
      orderBy: { displayOrder: 'desc' },
    });

    const displayOrder = lastSection ? lastSection.displayOrder + 1 : 1;

    // Create the CATEGORY_TILES section with 4 default tiles
    await this.prisma.landingSection.create({
      data: {
        landingPageId: homePageId,
        type: 'CATEGORY_TILES',
        title: 'Shop by Collection',
        displayOrder,
        data: JSON.stringify({
          tiles: [
            {
              title: 'Cookware',
              imageUrl: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600',
              linkUrl: '/category/cookware',
            },
            {
              title: 'Bakeware',
              imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
              linkUrl: '/category/bakeware',
            },
            {
              title: 'Kitchen Tools',
              imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600',
              linkUrl: '/category/kitchen-tools',
            },
            {
              title: 'Small Appliances',
              imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600',
              linkUrl: '/category/small-appliances',
            },
          ],
        }),
        config: JSON.stringify({
          columns: 4,
          mobileColumns: 2,
          aspectRatio: 1.2,
          showTitle: true,
          overlayOpacity: 0.3,
        }),
        isActive: true,
      },
    });

    console.log('[ContentService] ✅ CATEGORY_TILES section created successfully');
  }

  // ============================================================================
  // BANNER METHODS
  // ============================================================================

  async getActiveBanners(placement?: BannerPlacement) {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        ...(placement && { placement }),
        OR: [
          { startAt: null, endAt: null },
          { startAt: { lte: now }, endAt: { gte: now } },
          { startAt: { lte: now }, endAt: null },
          { startAt: null, endAt: { gte: now } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getAllBanners() {
    return this.prisma.banner.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getBanner(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }
    return banner;
  }

  async createBanner(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        placement: dto.placement || BannerPlacement.HOME_HERO,
        title: dto.title,
        subtitle: dto.subtitle,
        ctaText: dto.ctaText,
        ctaUrl: dto.ctaUrl,
        imageDesktopUrl: dto.imageDesktopUrl,
        imageMobileUrl: dto.imageMobileUrl,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateBanner(id: string, dto: UpdateBannerDto) {
    await this.getBanner(id);
    return this.prisma.banner.update({
      where: { id },
      data: {
        ...(dto.placement && { placement: dto.placement }),
        ...(dto.title && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.ctaText !== undefined && { ctaText: dto.ctaText }),
        ...(dto.ctaUrl !== undefined && { ctaUrl: dto.ctaUrl }),
        ...(dto.imageDesktopUrl && { imageDesktopUrl: dto.imageDesktopUrl }),
        ...(dto.imageMobileUrl !== undefined && { imageMobileUrl: dto.imageMobileUrl }),
        ...(dto.startAt !== undefined && { startAt: dto.startAt ? new Date(dto.startAt) : null }),
        ...(dto.endAt !== undefined && { endAt: dto.endAt ? new Date(dto.endAt) : null }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteBanner(id: string) {
    await this.getBanner(id);
    return this.prisma.banner.delete({ where: { id } });
  }

  // ============================================================================
  // LANDING PAGE METHODS
  // ============================================================================

  async getLandingPageBySlug(slug: string) {
    const page = await this.prisma.landingPage.findUnique({
      where: { slug, isActive: true },
      include: {
        heroBanner: true,
        sections: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException(`Landing page with slug "${slug}" not found`);
    }

    return page;
  }

  async getAllLandingPages() {
    return this.prisma.landingPage.findMany({
      include: {
        heroBanner: true,
        _count: {
          select: { sections: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLandingPage(id: string) {
    const page = await this.prisma.landingPage.findUnique({
      where: { id },
      include: {
        heroBanner: true,
        sections: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException(`Landing page with ID ${id} not found`);
    }

    return page;
  }

  async createLandingPage(dto: CreateLandingPageDto) {
    // Check if slug already exists
    const existing = await this.prisma.landingPage.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Landing page with slug "${dto.slug}" already exists`);
    }

    // Validate heroBanner if provided
    if (dto.heroBannerId) {
      await this.getBanner(dto.heroBannerId);
    }

    return this.prisma.landingPage.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        heroBannerId: dto.heroBannerId,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        isActive: dto.isActive ?? true,
      },
      include: {
        heroBanner: true,
      },
    });
  }

  async updateLandingPage(id: string, dto: UpdateLandingPageDto) {
    await this.getLandingPage(id);

    // Check if new slug already exists
    if (dto.slug) {
      const existing = await this.prisma.landingPage.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Landing page with slug "${dto.slug}" already exists`);
      }
    }

    // Validate heroBanner if provided
    if (dto.heroBannerId) {
      await this.getBanner(dto.heroBannerId);
    }

    return this.prisma.landingPage.update({
      where: { id },
      data: {
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.title && { title: dto.title }),
        ...(dto.heroBannerId !== undefined && { heroBannerId: dto.heroBannerId }),
        ...(dto.seoTitle !== undefined && { seoTitle: dto.seoTitle }),
        ...(dto.seoDescription !== undefined && { seoDescription: dto.seoDescription }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        heroBanner: true,
      },
    });
  }

  async deleteLandingPage(id: string) {
    await this.getLandingPage(id);
    // Sections will cascade delete
    return this.prisma.landingPage.delete({ where: { id } });
  }

  // ============================================================================
  // LANDING SECTION METHODS
  // ============================================================================

  async getAllSections() {
    return this.prisma.landingSection.findMany({
      include: {
        landingPage: true,
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getSection(id: string) {
    const section = await this.prisma.landingSection.findUnique({
      where: { id },
      include: {
        landingPage: true,
      },
    });

    if (!section) {
      throw new NotFoundException(`Landing section with ID ${id} not found`);
    }

    return section;
  }

  async createSection(dto: CreateLandingSectionDto) {
    // Validate landing page exists
    const page = await this.prisma.landingPage.findUnique({
      where: { id: dto.landingPageId },
    });

    if (!page) {
      throw new NotFoundException(`Landing page with ID ${dto.landingPageId} not found`);
    }

    // Validate JSON data
    try {
      JSON.parse(dto.data);
    } catch (error) {
      throw new ConflictException('Invalid JSON format for data field');
    }

    // Validate JSON config if provided
    if (dto.config) {
      try {
        JSON.parse(dto.config);
      } catch (error) {
        throw new ConflictException('Invalid JSON format for config field');
      }
    }

    return this.prisma.landingSection.create({
      data: {
        landingPageId: dto.landingPageId,
        type: dto.type,
        title: dto.title,
        subtitle: dto.subtitle,
        data: dto.data,
        config: dto.config,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        landingPage: true,
      },
    });
  }

  async updateSection(id: string, dto: UpdateLandingSectionDto) {
    await this.getSection(id);

    // Validate landing page if changed
    if (dto.landingPageId) {
      const page = await this.prisma.landingPage.findUnique({
        where: { id: dto.landingPageId },
      });
      if (!page) {
        throw new NotFoundException(`Landing page with ID ${dto.landingPageId} not found`);
      }
    }

    // Validate JSON data if provided
    if (dto.data) {
      try {
        JSON.parse(dto.data);
      } catch (error) {
        throw new ConflictException('Invalid JSON format for data field');
      }
    }

    // Validate JSON config if provided
    if (dto.config) {
      try {
        JSON.parse(dto.config);
      } catch (error) {
        throw new ConflictException('Invalid JSON format for config field');
      }
    }

    return this.prisma.landingSection.update({
      where: { id },
      data: {
        ...(dto.landingPageId && { landingPageId: dto.landingPageId }),
        ...(dto.type && { type: dto.type }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.data && { data: dto.data }),
        ...(dto.config !== undefined && { config: dto.config }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        landingPage: true,
      },
    });
  }

  async deleteSection(id: string) {
    await this.getSection(id);
    return this.prisma.landingSection.delete({ where: { id } });
  }

  async reorderSections(pageId: string, orders: Array<{ id: string; displayOrder: number }>) {
    // First verify the page exists
    await this.getLandingPage(pageId);

    // Update each section's display order in a transaction
    await this.prisma.$transaction(
      orders.map((order) =>
        this.prisma.landingSection.update({
          where: { id: order.id },
          data: { displayOrder: order.displayOrder },
        })
      )
    );

    // Return the updated page with sections
    return this.getLandingPage(pageId);
  }

  // ============================================================================
  // LOYALTY PAGE CONFIG METHODS
  // ============================================================================

  /**
   * Get loyalty page configuration
   * Auto-creates default config if none exists
   */
  async getLoyaltyConfig(): Promise<LoyaltyConfigResponseDto> {
    let config = await this.prisma.loyaltyPageConfig.findUnique({
      where: { key: 'default' },
    });

    // Auto-seed if no config exists
    if (!config) {
      config = await this.prisma.loyaltyPageConfig.create({
        data: {
          key: 'default',
          title: 'Join Our Loyalty Program',
          subtitle: 'Earn rewards with every purchase and unlock exclusive benefits',
          ctaText: 'Sign Up Now',
          ctaUrl: '/signup',
          spendAedThreshold: 1000,
          rewardAed: 10,
          howItWorksJson: [
            {
              icon: 'shopping_bag',
              title: 'Shop & Earn',
              description: 'Earn loyalty cash with every purchase you make on our platform',
            },
            {
              icon: 'account_balance_wallet',
              title: 'Accumulate Rewards',
              description: 'Watch your loyalty cash grow as you continue shopping with us',
            },
            {
              icon: 'redeem',
              title: 'Redeem & Save',
              description: 'Use your loyalty cash on future purchases to save money',
            },
          ],
          faqsJson: [
            {
              question: 'How do I earn loyalty cash?',
              answer:
                'You automatically earn loyalty cash with every qualifying purchase. For every AED 1,000 spent, you receive AED 10 in loyalty cash.',
            },
            {
              question: 'When can I use my loyalty cash?',
              answer:
                "Your loyalty cash is available for use immediately after it's credited to your account. You can apply it at checkout on your next purchase.",
            },
            {
              question: 'Does loyalty cash expire?',
              answer:
                'No, your loyalty cash never expires as long as your account remains active. Keep shopping to continue earning more!',
            },
            {
              question: 'Can I combine loyalty cash with other discounts?',
              answer:
                'Yes! You can use your loyalty cash in combination with most promotional offers and discount codes for maximum savings.',
            },
            {
              question: 'What purchases qualify for loyalty cash?',
              answer:
                'Most regular purchases qualify for loyalty cash. Some exclusions may apply for heavily discounted items or special promotions. Check product pages for details.',
            },
            {
              question: 'How do I check my loyalty cash balance?',
              answer:
                'You can view your current loyalty cash balance anytime in your account dashboard under the Loyalty Cash section.',
            },
          ],
        },
      });
    }

    return {
      title: config.title,
      subtitle: config.subtitle,
      ctaText: config.ctaText,
      ctaUrl: config.ctaUrl,
      spendAedThreshold: config.spendAedThreshold,
      rewardAed: config.rewardAed,
      howItWorks: config.howItWorksJson as any,
      faqs: config.faqsJson as any,
    };
  }

  /**
   * Update loyalty page configuration (Admin only)
   */
  async updateLoyaltyConfig(dto: UpdateLoyaltyConfigDto): Promise<LoyaltyConfigResponseDto> {
    // Ensure config exists (create if not)
    await this.getLoyaltyConfig();

    const updated = await this.prisma.loyaltyPageConfig.update({
      where: { key: 'default' },
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        ctaText: dto.ctaText,
        ctaUrl: dto.ctaUrl,
        spendAedThreshold: dto.spendAedThreshold,
        rewardAed: dto.rewardAed,
        howItWorksJson: dto.howItWorks as any,
        faqsJson: dto.faqs as any,
      },
    });

    return {
      title: updated.title,
      subtitle: updated.subtitle,
      ctaText: updated.ctaText,
      ctaUrl: updated.ctaUrl,
      spendAedThreshold: updated.spendAedThreshold,
      rewardAed: updated.rewardAed,
      howItWorks: updated.howItWorksJson as any,
      faqs: updated.faqsJson as any,
    };
  }
}
