import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getOrCreateCart(userId);
  }

  @Post('items')
  addItem(
    @CurrentUser('id') userId: string,
    @Body() addCartItemDto: AddCartItemDto,
  ) {
    return this.cartService.addItem(userId, addCartItemDto);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser('id') userId: string,
    @Param('id') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(userId, itemId, updateCartItemDto);
  }

  @Delete('items/:id')
  removeItem(
    @CurrentUser('id') userId: string,
    @Param('id') itemId: string,
  ) {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
