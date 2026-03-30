import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('debug')
export class DebugController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('status')
  async getStatus() {
    // Block in production
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    try {
      // Mask DATABASE_URL - show only host and database name
      const dbUrl = process.env.DATABASE_URL || '';
      let databaseUrlMasked = 'Not configured';
      try {
        const url = new URL(dbUrl);
        databaseUrlMasked = `${url.protocol}//${url.host}${url.pathname}`;
      } catch {
        databaseUrlMasked = 'Invalid URL format';
      }

      // Get counts from database tables
      const [productsCount, categoriesCount, brandsCount] = await Promise.all([
        this.prisma.product.count().catch(() => -1),
        this.prisma.category.count().catch(() => -1),
        this.prisma.brand.count().catch(() => -1),
      ]);

      // Check Category table (used by /categories endpoint if different)
      let categoryTreeCount = -1;
      try {
        categoryTreeCount = await this.prisma.category.count().catch(() => -1);
      } catch {
        categoryTreeCount = -1; // Error counting categories
      }

      // Check home page configuration (Banner table with HOME_HERO placement)
      let homeConfigured = false;
      let homeReason = 'Unknown';

      try {
        // Check for HOME_HERO banners (these power the homepage)
        const homeBannerCount = await this.prisma.banner.count({
          where: { placement: 'HOME_HERO', isActive: true },
        });
        
        if (homeBannerCount === 0) {
          homeReason = 'No active HOME_HERO banners configured';
        } else {
          homeConfigured = true;
          homeReason = `Homepage configured with ${homeBannerCount} active hero banner(s)`;
        }
      } catch (e) {
        homeReason = `Homepage check failed: ${e.message}`;
      }

      return {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        db: {
          provider: 'postgresql',
          databaseUrlMasked,
        },
        counts: {
          productsCount,
          categoriesCount,
          brandsCount,
          categoryTreeCount,
        },
        homepage: {
          homeConfigured,
          reason: homeReason,
        },
      };
    } catch (error) {
      console.error('[DebugController] Error fetching status:', error);
      throw new HttpException(
        {
          error: 'Database connection failed',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
