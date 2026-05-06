import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SeedImagesService } from './seed-images.service';

@Controller('admin/seed-images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class SeedImagesController {
  constructor(
    private readonly svc: SeedImagesService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  async run(
    @Body()
    body: {
      unsplashAccessKey?: string;
      scope?: 'all' | 'categories' | 'subcategories' | 'brands';
      overwrite?: boolean;
    },
  ) {
    const result = await this.svc.seed({
      unsplashAccessKey: body?.unsplashAccessKey ?? '',
      scope: body?.scope ?? 'all',
      overwrite: body?.overwrite ?? true,
    });
    // Bust the categories cache so updated images appear immediately
    try { await this.cacheManager.del('categories:all'); } catch { /* ignore */ }
    return result;
  }
}
