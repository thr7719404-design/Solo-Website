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
import { NavigationService } from './navigation.service';
import { CreateNavigationMenuDto, UpdateNavigationMenuDto, CreateNavigationMenuItemDto, UpdateNavigationMenuItemDto, ReorderMenuItemsDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  // ============================================================================
  // STOREFRONT ENDPOINTS (Public)
  // ============================================================================

  @Get('menu/:key')
  async getMenuByKey(@Param('key') key: string) {
    return this.navigationService.getMenuByKey(key);
  }

  // ============================================================================
  // ADMIN ENDPOINTS (Protected)
  // ============================================================================

  @Get('admin/menus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllMenus() {
    return this.navigationService.getAllMenus();
  }

  @Get('admin/menus/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getMenu(@Param('id') id: string) {
    return this.navigationService.getMenu(id);
  }

  @Post('admin/menus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createMenu(@Body() dto: CreateNavigationMenuDto) {
    return this.navigationService.createMenu(dto);
  }

  @Patch('admin/menus/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateMenu(@Param('id') id: string, @Body() dto: UpdateNavigationMenuDto) {
    return this.navigationService.updateMenu(id, dto);
  }

  @Delete('admin/menus/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteMenu(@Param('id') id: string) {
    return this.navigationService.deleteMenu(id);
  }

  // Menu Items
  @Get('admin/items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getMenuItem(@Param('id') id: string) {
    return this.navigationService.getMenuItem(id);
  }

  @Post('admin/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createMenuItem(@Body() dto: CreateNavigationMenuItemDto) {
    return this.navigationService.createMenuItem(dto);
  }

  @Patch('admin/items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateMenuItem(@Param('id') id: string, @Body() dto: UpdateNavigationMenuItemDto) {
    return this.navigationService.updateMenuItem(id, dto);
  }

  @Delete('admin/items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteMenuItem(@Param('id') id: string) {
    return this.navigationService.deleteMenuItem(id);
  }

  @Post('admin/menus/:id/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async reorderMenuItems(@Param('id') id: string, @Body() dto: ReorderMenuItemsDto) {
    return this.navigationService.reorderMenuItems(id, dto.orders);
  }
}
