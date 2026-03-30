import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CatalogVersionInfo {
  version: number;
  updatedAt: string;
  entityVersions: {
    categories: number;
    brands: number;
    products: number;
  };
}

/**
 * Catalog Service
 * Manages catalog versioning for frontend cache invalidation
 */
@Injectable()
export class CatalogService {
  // In-memory version tracking
  // In production, this should be stored in Redis or database
  private static catalogVersion = 1;
  private static lastUpdated = new Date();
  private static entityVersions = {
    categories: 1,
    brands: 1,
    products: 1,
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Get current catalog version
   */
  async getCatalogVersion(): Promise<CatalogVersionInfo> {
    return {
      version: CatalogService.catalogVersion,
      updatedAt: CatalogService.lastUpdated.toISOString(),
      entityVersions: { ...CatalogService.entityVersions },
    };
  }

  /**
   * Increment catalog version (call after any catalog change)
   */
  static incrementVersion(entity?: 'categories' | 'brands' | 'products') {
    CatalogService.catalogVersion++;
    CatalogService.lastUpdated = new Date();

    if (entity && CatalogService.entityVersions[entity] !== undefined) {
      CatalogService.entityVersions[entity]++;
    }

    console.log(`📦 Catalog version updated to ${CatalogService.catalogVersion}`);
  }

  /**
   * Increment categories version
   */
  static incrementCategoriesVersion() {
    CatalogService.incrementVersion('categories');
  }

  /**
   * Increment brands version
   */
  static incrementBrandsVersion() {
    CatalogService.incrementVersion('brands');
  }

  /**
   * Increment products version
   */
  static incrementProductsVersion() {
    CatalogService.incrementVersion('products');
  }
}
