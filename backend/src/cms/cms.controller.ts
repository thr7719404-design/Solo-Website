import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('cms')
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  // ========================= PUBLIC =========================

  @Get('home-page')
  getHomePage() {
    return this.cms.getHomePage();
  }

  @Get('category/:categoryId')
  getCategoryLanding(@Param('categoryId') categoryId: string) {
    return this.cms.getCategoryLanding(categoryId);
  }

  // ========================= ADMIN: Home Page =========================

  @Get('admin/home')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getHomePageAdmin() {
    return this.cms.getHomePageAdmin();
  }

  @Post('admin/home/sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  createHomeSection(@Body() dto: any) {
    return this.cms.createHomeSection(dto);
  }

  @Patch('admin/home/sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateHomeSection(@Param('id') id: string, @Body() dto: any) {
    return this.cms.updateHomeSection(id, dto);
  }

  @Delete('admin/home/sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteHomeSection(@Param('id') id: string) {
    return this.cms.deleteHomeSection(id);
  }

  @Post('admin/home/sections/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  reorderHomeSections(@Body() dto: { orders: { id: string; position: number }[] }) {
    return this.cms.reorderHomeSections(dto.orders);
  }

  // ========================= ADMIN: Category Landing =========================

  @Get('admin/category-landings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAllCategoryLandings() {
    return this.cms.getAllCategoryLandings();
  }

  @Get('admin/category-landings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getCategoryLandingAdmin(@Param('id') id: string) {
    return this.cms.getCategoryLandingAdmin(id);
  }

  @Post('admin/category-landings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  createCategoryLanding(@Body() dto: any) {
    return this.cms.createCategoryLanding(dto);
  }

  @Patch('admin/category-landings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateCategoryLanding(@Param('id') id: string, @Body() dto: any) {
    return this.cms.updateCategoryLanding(id, dto);
  }

  @Delete('admin/category-landings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteCategoryLanding(@Param('id') id: string) {
    return this.cms.deleteCategoryLanding(id);
  }

  @Post('admin/category-landings/:landingId/sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  createCategorySection(@Param('landingId') landingId: string, @Body() dto: any) {
    return this.cms.createCategorySection(landingId, dto);
  }

  @Patch('admin/category-sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateCategorySection(@Param('id') id: string, @Body() dto: any) {
    return this.cms.updateCategorySection(id, dto);
  }

  @Delete('admin/category-sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteCategorySection(@Param('id') id: string) {
    return this.cms.deleteCategorySection(id);
  }

  @Post('admin/category-landings/:landingId/sections/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  reorderCategorySections(
    @Param('landingId') landingId: string,
    @Body() dto: { orders: { id: string; position: number }[] },
  ) {
    return this.cms.reorderCategorySections(landingId, dto.orders);
  }
}
