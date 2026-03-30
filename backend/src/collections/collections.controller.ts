import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, UpdateCollectionDto, AddCollectionItemDto, ReorderCollectionItemsDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  // ============================================================================
  // STOREFRONT ENDPOINTS (Public)
  // ============================================================================

  @Get(':key/products')
  async getCollectionProducts(@Param('key') key: string) {
    return this.collectionsService.getCollectionProducts(key);
  }

  // ============================================================================
  // ADMIN ENDPOINTS (Protected)
  // ============================================================================

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllCollections() {
    return this.collectionsService.getAllCollections();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getCollection(@Param('id') id: string) {
    return this.collectionsService.getCollection(id);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createCollection(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.createCollection(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateCollection(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.updateCollection(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteCollection(@Param('id') id: string) {
    return this.collectionsService.deleteCollection(id);
  }

  // Collection Items
  @Post('admin/:id/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async addCollectionItem(@Param('id') id: string, @Body() dto: AddCollectionItemDto) {
    return this.collectionsService.addCollectionItem(id, dto.productId, dto.sortOrder);
  }

  @Delete('admin/:id/items/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async removeCollectionItem(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.collectionsService.removeCollectionItem(id, parseInt(productId, 10));
  }

  @Post('admin/:id/items/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async reorderCollectionItems(@Param('id') id: string, @Body() dto: ReorderCollectionItemsDto) {
    return this.collectionsService.reorderCollectionItems(id, dto.orders);
  }
}
