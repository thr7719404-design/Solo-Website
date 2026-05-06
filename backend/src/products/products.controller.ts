import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  Header,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CacheInterceptor, CacheTTL, CacheKey } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';
import { ProductFilterDto, CreateProductDto, UpdateProductDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@SkipThrottle()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Inventory Categories/Brands endpoints (for product form dropdowns)
  // ─────────────────────────────────────────────────────────────────────────
  @Get('inventory/categories')
  getInventoryCategories() {
    return this.productsService.getInventoryCategories();
  }

  @Get('inventory/brands')
  getInventoryBrands() {
    return this.productsService.getInventoryBrands();
  }

  // Public endpoints
  @Get()
  findAll(@Query() filters: ProductFilterDto) {
    return this.productsService.findAll(filters);
  }

  @Get('featured')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('products:featured')
  @CacheTTL(120_000)
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=600')
  getFeatured(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 8;
    return this.productsService.getFeatured(parsedLimit);
  }

  @Get('best-sellers')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('products:best-sellers')
  @CacheTTL(120_000)
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=600')
  getBestSellers(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 8;
    return this.productsService.getBestSellers(parsedLimit);
  }

  @Get('new-arrivals')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('products:new-arrivals')
  @CacheTTL(120_000)
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=600')
  getNewArrivals(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 8;
    return this.productsService.getNewArrivals(parsedLimit);
  }

  @Get(':id/related')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000)
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  getRelated(@Param('id') id: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 6;
    return this.productsService.getRelated(id, parsedLimit);
  }

  @Get(':slugOrId')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000)
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  findOne(@Param('slugOrId') slugOrId: string) {
    return this.productsService.findOne(slugOrId);
  }

  // Admin endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
