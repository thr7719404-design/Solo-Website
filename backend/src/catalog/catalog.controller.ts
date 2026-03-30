import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * Get current catalog version
   * Used by frontend for cache invalidation
   */
  @Get('version')
  async getVersion() {
    return this.catalogService.getCatalogVersion();
  }

  /**
   * Get catalog health/status
   */
  @Get('health')
  async getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
