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
  Put,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ContentService } from './content.service';
import { CreateBannerDto, BannerPlacement } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { CreateLandingSectionDto } from './dto/create-landing-section.dto';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';
import { UpdateLoyaltyConfigDto } from './dto/loyalty-config.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@SkipThrottle()
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ============================================================================
  // PUBLIC ENDPOINTS
  // ============================================================================

  /**
   * Get homepage layout with all active sections
   * Returns the landing page with slug "home" including ordered active sections
   */
  @Get('home')
  getHomePage() {
    return this.contentService.getHomePage();
  }

  @Get('banners')
  getActiveBanners(@Query('placement') placement?: BannerPlacement) {
    return this.contentService.getActiveBanners(placement);
  }

  @Get('pages/:slug')
  getLandingPageBySlug(@Param('slug') slug: string) {
    return this.contentService.getLandingPageBySlug(slug);
  }

  /**
   * Get loyalty page configuration
   * Public endpoint - used by Flutter app
   */
  @Get('loyalty-config')
  getLoyaltyConfig() {
    return this.contentService.getLoyaltyConfig();
  }

  // ============================================================================
  // ADMIN BANNER ENDPOINTS
  // Routes support both /content/admin/banners/* and /content/banners/* patterns
  // ============================================================================

  // Alias: GET /content/banners/all (frontend compatibility)
  @Get('banners/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAllBannersAlias() {
    return this.contentService.getAllBanners();
  }

  @Get('admin/banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAllBanners() {
    return this.contentService.getAllBanners();
  }

  @Get('admin/banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getBanner(@Param('id') id: string) {
    return this.contentService.getBanner(id);
  }

  // POST /content/banners (frontend compatibility)
  @Post('banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  createBannerAlias(@Body() dto: CreateBannerDto) {
    return this.contentService.createBanner(dto);
  }

  @Post('admin/banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  createBanner(@Body() dto: CreateBannerDto) {
    return this.contentService.createBanner(dto);
  }

  // PATCH /content/banners/:id (frontend compatibility)
  @Patch('banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateBannerAlias(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.contentService.updateBanner(id, dto);
  }

  @Patch('admin/banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateBanner(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.contentService.updateBanner(id, dto);
  }

  // DELETE /content/banners/:id (frontend compatibility)
  @Delete('banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteBannerAlias(@Param('id') id: string) {
    return this.contentService.deleteBanner(id);
  }

  @Delete('admin/banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteBanner(@Param('id') id: string) {
    return this.contentService.deleteBanner(id);
  }

  // ============================================================================
  // ADMIN LANDING PAGE ENDPOINTS
  // Routes support both /content/admin/pages/* and /content/pages/* patterns
  // ============================================================================

  // GET /content/pages (admin list - frontend compatibility)
  // Note: This route must come BEFORE the public /:slug route
  @Get('pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAllLandingPagesAlias() {
    return this.contentService.getAllLandingPages();
  }

  @Get('admin/pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAllLandingPages() {
    return this.contentService.getAllLandingPages();
  }

  @Get('admin/pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getLandingPage(@Param('id') id: string) {
    return this.contentService.getLandingPage(id);
  }

  // POST /content/pages (frontend compatibility)
  @Post('pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  createLandingPageAlias(@Body() dto: CreateLandingPageDto) {
    return this.contentService.createLandingPage(dto);
  }

  @Post('admin/pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  createLandingPage(@Body() dto: CreateLandingPageDto) {
    return this.contentService.createLandingPage(dto);
  }

  // PATCH /content/pages/:id (frontend compatibility)
  @Patch('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateLandingPageAlias(@Param('id') id: string, @Body() dto: UpdateLandingPageDto) {
    return this.contentService.updateLandingPage(id, dto);
  }

  @Patch('admin/pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateLandingPage(@Param('id') id: string, @Body() dto: UpdateLandingPageDto) {
    return this.contentService.updateLandingPage(id, dto);
  }

  // DELETE /content/pages/:id (frontend compatibility)
  @Delete('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteLandingPageAlias(@Param('id') id: string) {
    return this.contentService.deleteLandingPage(id);
  }

  @Delete('admin/pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteLandingPage(@Param('id') id: string) {
    return this.contentService.deleteLandingPage(id);
  }

  // POST /content/pages/:pageId/sections (frontend compatibility)
  @Post('pages/:pageId/sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  createSectionForPage(@Param('pageId') pageId: string, @Body() dto: CreateLandingSectionDto) {
    return this.contentService.createSection({ ...dto, landingPageId: pageId });
  }

  // POST /content/pages/:pageId/sections/reorder (frontend compatibility)
  @Post('pages/:pageId/sections/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  reorderSections(@Param('pageId') pageId: string, @Body() body: { orders: Array<{ id: string; displayOrder: number }> }) {
    return this.contentService.reorderSections(pageId, body.orders);
  }

  // PATCH /content/sections/:id (frontend compatibility)
  @Patch('sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateSectionAlias(@Param('id') id: string, @Body() dto: UpdateLandingSectionDto) {
    return this.contentService.updateSection(id, dto);
  }

  // DELETE /content/sections/:id (frontend compatibility)
  @Delete('sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteSectionAlias(@Param('id') id: string) {
    return this.contentService.deleteSection(id);
  }

  // ============================================================================
  // ADMIN LANDING SECTION ENDPOINTS
  // ============================================================================

  @Get('admin/sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAllSections() {
    return this.contentService.getAllSections();
  }

  @Get('admin/sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getSection(@Param('id') id: string) {
    return this.contentService.getSection(id);
  }

  @Post('admin/sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  createSection(@Body() dto: CreateLandingSectionDto) {
    return this.contentService.createSection(dto);
  }

  @Patch('admin/sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateSection(@Param('id') id: string, @Body() dto: UpdateLandingSectionDto) {
    return this.contentService.updateSection(id, dto);
  }

  @Delete('admin/sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteSection(@Param('id') id: string) {
    return this.contentService.deleteSection(id);
  }

  // ============================================================================
  // ADMIN LOYALTY CONFIG ENDPOINTS
  // ============================================================================

  @Put('admin/loyalty-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateLoyaltyConfig(@Body() dto: UpdateLoyaltyConfigDto) {
    return this.contentService.updateLoyaltyConfig(dto);
  }
}
