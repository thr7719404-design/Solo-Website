import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SaveVatConfigDto, SaveLoyaltyConfigDto } from './dto/settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ══════════════════════════════════════════════
  //  PUBLIC — storefront needs VAT% for display
  // ══════════════════════════════════════════════

  /** Get VAT config (public — needed for cart/checkout display) */
  @Get('vat')
  async getPublicVatConfig() {
    return this.settingsService.getVatConfig();
  }

  /** Get loyalty config (public — needed for checkout display) */
  @Get('loyalty')
  async getPublicLoyaltyConfig() {
    return this.settingsService.getLoyaltyConfig();
  }

  // ══════════════════════════════════════════════
  //  ADMIN — manage VAT configuration
  // ══════════════════════════════════════════════

  /** Get VAT configuration (admin) */
  @Get('admin/vat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAdminVatConfig() {
    return this.settingsService.getVatConfig();
  }

  /** Save VAT configuration (admin) */
  @Post('admin/vat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async saveVatConfig(@Body() dto: SaveVatConfigDto) {
    await this.settingsService.saveVatConfig(
      dto.vatPercent,
      dto.isEnabled ?? true,
      dto.label ?? 'VAT',
    );
    return { message: 'VAT configuration saved successfully' };
  }

  // ══════════════════════════════════════════════
  //  ADMIN — manage Loyalty configuration
  // ══════════════════════════════════════════════

  /** Get Loyalty configuration (admin) */
  @Get('admin/loyalty')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAdminLoyaltyConfig() {
    return this.settingsService.getLoyaltyConfig();
  }

  /** Save Loyalty configuration (admin) */
  @Post('admin/loyalty')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async saveLoyaltyConfig(@Body() dto: SaveLoyaltyConfigDto) {
    await this.settingsService.saveLoyaltyConfig(
      dto.earnPercent,
      dto.maxRedeemPercent ?? 0.30,
      dto.isEnabled ?? true,
    );
    return { message: 'Loyalty configuration saved successfully' };
  }
}
