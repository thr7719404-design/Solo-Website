import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  // ========================= ADMIN: Home Page =========================

  async getHomePageAdmin() {
    return this.prisma.homePageConfig.upsert({
      where: { key: 'home' },
      update: {},
      create: { key: 'home' },
      include: {
        sections: { orderBy: { position: 'asc' } },
      },
    });
  }

  async createHomeSection(dto: {
    type: string;
    title?: string;
    subtitle?: string;
    position: number;
    isEnabled?: boolean;
    config?: any;
  }) {
    const home = await this.prisma.homePageConfig.upsert({
      where: { key: 'home' },
      update: {},
      create: { key: 'home' },
    });

    return this.prisma.homePageSection.create({
      data: {
        homePageId: home.id,
        type: dto.type as any,
        title: dto.title,
        subtitle: dto.subtitle,
        position: dto.position,
        isEnabled: dto.isEnabled ?? true,
        config: dto.config ?? {},
      },
    });
  }

  async updateHomeSection(id: string, dto: Partial<{
    type: string;
    title: string;
    subtitle: string;
    position: number;
    isEnabled: boolean;
    config: any;
  }>) {
    return this.prisma.homePageSection.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type as any }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
        ...(dto.config !== undefined && { config: dto.config }),
      },
    });
  }

  async deleteHomeSection(id: string) {
    return this.prisma.homePageSection.delete({ where: { id } });
  }

  async reorderHomeSections(orders: { id: string; position: number }[]) {
    await this.prisma.$transaction(
      orders.map((o) =>
        this.prisma.homePageSection.update({
          where: { id: o.id },
          data: { position: o.position },
        }),
      ),
    );
    return { success: true };
  }

  // ========================= ADMIN: Category Landing =========================

  async getAllCategoryLandings() {
    return this.prisma.categoryLandingPageConfig.findMany({
      include: { sections: { orderBy: { position: 'asc' } } },
    });
  }

  async getCategoryLandingAdmin(id: string) {
    const landing = await this.prisma.categoryLandingPageConfig.findUnique({
      where: { id },
      include: { sections: { orderBy: { position: 'asc' } } },
    });
    if (!landing) throw new NotFoundException('Category landing not found');
    return landing;
  }

  async createCategoryLanding(dto: {
    categoryId: string;
    isHeroEnabled?: boolean;
    heroTitle?: string;
    heroSubtitle?: string;
    heroImageUrl?: string;
    heroImageMobileUrl?: string;
    ctaLabel?: string;
    ctaTargetType?: string;
    ctaTargetValue?: string;
  }) {
    return this.prisma.categoryLandingPageConfig.create({ data: dto });
  }

  async updateCategoryLanding(id: string, dto: Partial<{
    isHeroEnabled: boolean;
    heroTitle: string;
    heroSubtitle: string;
    heroImageUrl: string;
    heroImageMobileUrl: string;
    ctaLabel: string;
    ctaTargetType: string;
    ctaTargetValue: string;
  }>) {
    return this.prisma.categoryLandingPageConfig.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategoryLanding(id: string) {
    return this.prisma.categoryLandingPageConfig.delete({ where: { id } });
  }

  async createCategorySection(landingId: string, dto: {
    type: string;
    title?: string;
    position: number;
    isEnabled?: boolean;
    config?: any;
  }) {
    return this.prisma.categoryLandingSection.create({
      data: {
        landingId,
        type: dto.type as any,
        title: dto.title,
        position: dto.position,
        isEnabled: dto.isEnabled ?? true,
        config: dto.config ?? {},
      },
    });
  }

  async updateCategorySection(id: string, dto: Partial<{
    type: string;
    title: string;
    position: number;
    isEnabled: boolean;
    config: any;
  }>) {
    return this.prisma.categoryLandingSection.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type as any }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
        ...(dto.config !== undefined && { config: dto.config }),
      },
    });
  }

  async deleteCategorySection(id: string) {
    return this.prisma.categoryLandingSection.delete({ where: { id } });
  }

  async reorderCategorySections(landingId: string, orders: { id: string; position: number }[]) {
    await this.prisma.$transaction(
      orders.map((o) =>
        this.prisma.categoryLandingSection.update({
          where: { id: o.id },
          data: { position: o.position },
        }),
      ),
    );
    return { success: true };
  }

  // ========================= PUBLIC =========================

  async getHomePage() {
    return this.prisma.homePageConfig.upsert({
      where: { key: 'home' },
      update: {},
      create: { key: 'home' },
      include: {
        sections: {
          where: { isEnabled: true },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async getCategoryLanding(categoryId: string) {
    const landing = await this.prisma.categoryLandingPageConfig.findUnique({
      where: { categoryId },
      include: {
        sections: {
          where: { isEnabled: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!landing) {
      return {
        categoryId,
        isHeroEnabled: false,
        heroTitle: null,
        heroSubtitle: null,
        heroImageUrl: null,
        heroImageMobileUrl: null,
        ctaLabel: null,
        ctaTargetType: null,
        ctaTargetValue: null,
        sections: [
          { type: 'SUBCATEGORY_NAV', title: null, position: 1, isEnabled: true, config: {} },
          { type: 'PRODUCT_GRID', title: null, position: 2, isEnabled: true, config: {} },
        ],
      };
    }

    return landing;
  }
}
