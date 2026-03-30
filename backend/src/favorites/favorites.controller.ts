import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { id: string; email: string; role: string };
}

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /**
   * GET /favorites - Get user's favorites list with product details
   */
  @Get()
  async getFavorites(@Req() req: AuthRequest) {
    return this.favoritesService.getFavorites(req.user.id);
  }

  /**
   * GET /favorites/ids - Get just the product IDs (for quick client-side lookup)
   */
  @Get('ids')
  async getFavoriteIds(@Req() req: AuthRequest) {
    const ids = await this.favoritesService.getFavoriteIds(req.user.id);
    return { productIds: ids.map(id => id.toString()) };
  }

  /**
   * POST /favorites/:productId - Add product to favorites
   */
  @Post(':productId')
  async addFavorite(
    @Req() req: AuthRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.favoritesService.addFavorite(req.user.id, productId);
  }

  /**
   * DELETE /favorites/:productId - Remove product from favorites
   */
  @Delete(':productId')
  async removeFavorite(
    @Req() req: AuthRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.favoritesService.removeFavorite(req.user.id, productId);
  }

  /**
   * POST /favorites/:productId/toggle - Toggle favorite status
   */
  @Post(':productId/toggle')
  async toggleFavorite(
    @Req() req: AuthRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.favoritesService.toggleFavorite(req.user.id, productId);
  }

  /**
   * GET /favorites/:productId/check - Check if product is favorited
   */
  @Get(':productId/check')
  async checkFavorite(
    @Req() req: AuthRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const isFavorite = await this.favoritesService.isFavorite(req.user.id, productId);
    return { isFavorite };
  }
}
