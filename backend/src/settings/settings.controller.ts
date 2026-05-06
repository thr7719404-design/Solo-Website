import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SaveVatConfigDto, SaveLoyaltyConfigDto, SaveShippingConfigDto, SavePaymentsConfigDto } from './dto/settings.dto';

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

  /** Get shipping config (public — needed for cart/checkout display) */
  @Get('shipping')
  async getPublicShippingConfig() {
    return this.settingsService.getShippingConfig();
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

  // ══════════════════════════════════════════════
  //  ADMIN — manage Shipping configuration
  // ══════════════════════════════════════════════

  /** Get Shipping configuration (admin) */
  @Get('admin/shipping')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAdminShippingConfig() {
    return this.settingsService.getShippingConfig();
  }

  /** Save Shipping configuration (admin) — fee is mandatory and cannot be disabled */
  @Post('admin/shipping')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async saveShippingConfig(@Body() dto: SaveShippingConfigDto) {
    await this.settingsService.saveShippingConfig(
      dto.fee,
      dto.label ?? 'Shipping',
      dto.freeShippingThreshold ?? 0,
    );
    return { message: 'Shipping configuration saved successfully' };
  }

  // ══════════════════════════════════════════════
  //  ADMIN — manage Payments (Tabby + Tamara)
  // ══════════════════════════════════════════════

  /** Get Payments configuration (admin) — secret values are masked */
  @Get('admin/payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAdminPaymentsConfig() {
    return this.settingsService.getPaymentsConfig();
  }

  /** Save Payments configuration (admin). Empty/omitted secret fields preserve existing keys. */
  @Post('admin/payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async savePaymentsConfig(@Body() dto: SavePaymentsConfigDto) {
    await this.settingsService.savePaymentsConfig(dto);
    return { message: 'Payments configuration saved successfully' };
  }
}
