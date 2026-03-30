import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Generic helpers ──

  private async upsertSetting(
    key: string,
    value: string,
    group: string,
    label: string,
    type: string = 'string',
  ): Promise<void> {
    await this.prisma.siteSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value, type, group, label },
    });
  }

  private async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key } });
    return setting?.value ?? null;
  }

  // ── VAT Configuration ──

  /** Get VAT percentage (defaults to 5 if not configured) */
  async getVatPercent(): Promise<number> {
    const value = await this.getSetting('vat_percent');
    if (value === null) return 5; // UAE default
    return parseFloat(value);
  }

  /** Check if VAT is enabled */
  async isVatEnabled(): Promise<boolean> {
    const value = await this.getSetting('vat_enabled');
    return value === 'true';
  }

  /** Get VAT label (e.g. "VAT", "GST") */
  async getVatLabel(): Promise<string> {
    const value = await this.getSetting('vat_label');
    return value || 'VAT';
  }

  /** Get full VAT configuration */
  async getVatConfig(): Promise<{
    vatPercent: number;
    isEnabled: boolean;
    label: string;
  }> {
    const settings = await this.prisma.siteSetting.findMany({
      where: { group: 'vat' },
    });

    const getValue = (key: string) => settings.find(s => s.key === key)?.value;

    return {
      vatPercent: parseFloat(getValue('vat_percent') || '5'),
      isEnabled: getValue('vat_enabled') === 'true',
      label: getValue('vat_label') || 'VAT',
    };
  }

  /** Save VAT configuration */
  async saveVatConfig(vatPercent: number, isEnabled: boolean = true, label: string = 'VAT'): Promise<void> {
    await this.upsertSetting('vat_percent', vatPercent.toString(), 'vat', 'VAT Percentage', 'number');
    await this.upsertSetting('vat_enabled', isEnabled.toString(), 'vat', 'VAT Enabled', 'boolean');
    await this.upsertSetting('vat_label', label, 'vat', 'VAT Label', 'string');
    this.logger.log(`VAT config saved: ${vatPercent}% (${isEnabled ? 'enabled' : 'disabled'}), label: ${label}`);
  }

  /** Get VAT rate as a decimal (e.g. 0.05 for 5%) — for use in calculations */
  async getVatRate(): Promise<number> {
    const enabled = await this.isVatEnabled();
    if (!enabled) return 0;
    const percent = await this.getVatPercent();
    return percent / 100;
  }

  // ── Loyalty Configuration ──

  /** Get full loyalty configuration */
  async getLoyaltyConfig(): Promise<{
    earnPercent: number;
    maxRedeemPercent: number;
    isEnabled: boolean;
  }> {
    const settings = await this.prisma.siteSetting.findMany({
      where: { group: 'loyalty' },
    });

    const getValue = (key: string) => settings.find(s => s.key === key)?.value;

    return {
      earnPercent: parseFloat(getValue('loyalty_earn_percent') || '0.05'),
      maxRedeemPercent: parseFloat(getValue('loyalty_max_redeem_percent') || '0.30'),
      isEnabled: getValue('loyalty_enabled') !== 'false', // default true
    };
  }

  /** Save loyalty configuration */
  async saveLoyaltyConfig(
    earnPercent: number,
    maxRedeemPercent: number = 0.30,
    isEnabled: boolean = true,
  ): Promise<void> {
    await this.upsertSetting('loyalty_earn_percent', earnPercent.toString(), 'loyalty', 'Loyalty Earn Percent (e.g., 0.05 = 5%)', 'number');
    await this.upsertSetting('loyalty_max_redeem_percent', maxRedeemPercent.toString(), 'loyalty', 'Max Redeem Percent of Subtotal (e.g., 0.30 = 30%)', 'number');
    await this.upsertSetting('loyalty_enabled', isEnabled.toString(), 'loyalty', 'Loyalty Program Enabled', 'boolean');
    this.logger.log(`Loyalty config saved: earn=${earnPercent}, maxRedeem=${maxRedeemPercent}, enabled=${isEnabled}`);
  }
}
