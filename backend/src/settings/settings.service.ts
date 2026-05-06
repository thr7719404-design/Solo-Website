import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
  ) {}

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

  /** Get VAT percentage — always 5% (UAE standard, non-configurable) */
  async getVatPercent(): Promise<number> {
    return 5;
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
      vatPercent: Number.parseFloat(getValue('vat_percent') || '5'),
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

  /** Get VAT rate as a decimal — always 0.05 (UAE 5%, non-configurable) */
  async getVatRate(): Promise<number> {
    return 0.05;
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
      earnPercent: Number.parseFloat(getValue('loyalty_earn_percent') || '0.05'),
      maxRedeemPercent: Number.parseFloat(getValue('loyalty_max_redeem_percent') || '0.30'),
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

  // ── Shipping Configuration ──
  // Shipping is mandatory and always charged on every order.
  // The fee is editable but cannot be deactivated or removed.

  /** Get shipping fee in AED (defaults to 10 if not configured) */
  async getShippingFee(): Promise<number> {
    const value = await this.getSetting('shipping_fee');
    if (value === null) {
      // Auto-seed default so admins always see a value
      await this.upsertSetting('shipping_fee', '10', 'shipping', 'Shipping Fee (AED)', 'number');
      return 10;
    }
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 10 : parsed;
  }

  /** Get shipping label */
  async getShippingLabel(): Promise<string> {
    const value = await this.getSetting('shipping_label');
    return value || 'Shipping';
  }

  /**
   * Free shipping threshold in AED. When order subtotal >= threshold,
   * shipping fee is waived. 0 means feature is disabled (always charge).
   */
  async getFreeShippingThreshold(): Promise<number> {
    const value = await this.getSetting('shipping_free_threshold');
    if (value === null) return 0;
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }

  /** Get full shipping configuration */
  async getShippingConfig(): Promise<{ fee: number; label: string; freeShippingThreshold: number }> {
    const fee = await this.getShippingFee();
    const label = await this.getShippingLabel();
    const freeShippingThreshold = await this.getFreeShippingThreshold();
    return { fee, label, freeShippingThreshold };
  }

  /** Save shipping configuration (fee is mandatory; cannot be disabled) */
  async saveShippingConfig(
    fee: number,
    label: string = 'Shipping',
    freeShippingThreshold: number = 0,
  ): Promise<void> {
    if (fee === null || fee === undefined || Number.isNaN(fee) || fee < 0) {
      throw new Error('Shipping fee is mandatory and must be a non-negative number');
    }
    const safeThreshold = Number.isFinite(freeShippingThreshold) && freeShippingThreshold >= 0
      ? freeShippingThreshold
      : 0;
    await this.upsertSetting('shipping_fee', fee.toString(), 'shipping', 'Shipping Fee (AED)', 'number');
    await this.upsertSetting('shipping_label', label, 'shipping', 'Shipping Label', 'string');
    await this.upsertSetting(
      'shipping_free_threshold',
      safeThreshold.toString(),
      'shipping',
      'Free Shipping Threshold (AED, 0 = disabled)',
      'number',
    );
    this.logger.log(
      `Shipping config saved: fee=AED ${fee}, label=${label}, freeOver=${safeThreshold > 0 ? `AED ${safeThreshold}` : 'disabled'}`,
    );
  }

  // ── Payments (BNPL: Tabby + Tamara) ──

  /** Mask a secret value, returning only the last 4 chars. */
  private maskSecret(value: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (trimmed.length <= 4) return '••••';
    return `••••${trimmed.slice(-4)}`;
  }

  /** Get full payments configuration (admin). Secrets are masked; flags are real booleans. */
  async getPaymentsConfig(): Promise<{
    codEnabled: boolean;
    stripeEnabled: boolean;
    stripePublishableKey: string | null;
    stripeSecretKeyMasked: string | null;
    stripeWebhookSecretMasked: string | null;
    tabbyEnabled: boolean;
    tabbyPublicKeyMasked: string | null;
    tabbySecretKeyMasked: string | null;
    tamaraEnabled: boolean;
    tamaraSandbox: boolean;
    tamaraApiTokenMasked: string | null;
  }> {
    const [
      codEnabledRaw,
      stripeEnabledRaw,
      stripePublishableKey,
      stripeSecretKey,
      stripeWebhookSecret,
      tabbyEnabledRaw,
      tabbyPublicKey,
      tabbySecretKey,
      tamaraEnabledRaw,
      tamaraSandboxRaw,
      tamaraApiToken,
    ] = await Promise.all([
      this.getSetting('cod_enabled'),
      this.getSetting('stripe_enabled'),
      this.getSetting('stripe_publishable_key'),
      this.getSetting('stripe_secret_key'),
      this.getSetting('stripe_webhook_secret'),
      this.getSetting('tabby_enabled'),
      this.getSetting('tabby_public_key'),
      this.getSetting('tabby_secret_key'),
      this.getSetting('tamara_enabled'),
      this.getSetting('tamara_sandbox'),
      this.getSetting('tamara_api_token'),
    ]);

    return {
      // COD defaults to enabled when no setting row exists yet (legacy behaviour).
      codEnabled: codEnabledRaw === null ? true : codEnabledRaw === 'true',
      stripeEnabled: stripeEnabledRaw === 'true',
      stripePublishableKey: stripePublishableKey || null,
      stripeSecretKeyMasked: this.maskSecret(stripeSecretKey),
      stripeWebhookSecretMasked: this.maskSecret(stripeWebhookSecret),
      tabbyEnabled: tabbyEnabledRaw === 'true',
      tabbyPublicKeyMasked: this.maskSecret(tabbyPublicKey),
      tabbySecretKeyMasked: this.maskSecret(tabbySecretKey),
      tamaraEnabled: tamaraEnabledRaw === 'true',
      tamaraSandbox: tamaraSandboxRaw === 'true',
      tamaraApiTokenMasked: this.maskSecret(tamaraApiToken),
    };
  }

  /**
   * Save payments configuration. Secret fields are only updated when a non-empty
   * string is provided — passing `undefined` or empty string preserves the existing key.
   * Boolean flags are always written when provided.
   */
  async savePaymentsConfig(input: {
    codEnabled?: boolean;
    stripeEnabled?: boolean;
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    stripeWebhookSecret?: string;
    tabbyEnabled?: boolean;
    tabbyPublicKey?: string;
    tabbySecretKey?: string;
    tamaraEnabled?: boolean;
    tamaraSandbox?: boolean;
    tamaraApiToken?: string;
  }): Promise<void> {
    const writes: Promise<void>[] = [];

    if (input.codEnabled !== undefined) {
      writes.push(this.upsertSetting(
        'cod_enabled', input.codEnabled ? 'true' : 'false', 'payments', 'Cash on Delivery Enabled', 'boolean',
      ));
    }

    if (input.stripeEnabled !== undefined) {
      writes.push(this.upsertSetting(
        'stripe_enabled', input.stripeEnabled ? 'true' : 'false', 'stripe', 'Stripe Enabled', 'boolean',
      ));
    }
    if (input.stripePublishableKey && input.stripePublishableKey.trim().length > 0) {
      writes.push(this.upsertSetting(
        'stripe_publishable_key', input.stripePublishableKey.trim(), 'stripe', 'Stripe Publishable Key', 'string',
      ));
    }
    if (input.stripeSecretKey && input.stripeSecretKey.trim().length > 0) {
      writes.push(this.upsertSetting(
        'stripe_secret_key', input.stripeSecretKey.trim(), 'stripe', 'Stripe Secret Key', 'secret',
      ));
    }
    if (input.stripeWebhookSecret && input.stripeWebhookSecret.trim().length > 0) {
      writes.push(this.upsertSetting(
        'stripe_webhook_secret', input.stripeWebhookSecret.trim(), 'stripe', 'Stripe Webhook Secret', 'secret',
      ));
    }

    if (input.tabbyEnabled !== undefined) {
      writes.push(this.upsertSetting(
        'tabby_enabled', input.tabbyEnabled ? 'true' : 'false', 'payments', 'Tabby Enabled', 'boolean',
      ));
    }
    if (input.tabbyPublicKey && input.tabbyPublicKey.trim().length > 0) {
      writes.push(this.upsertSetting(
        'tabby_public_key', input.tabbyPublicKey.trim(), 'payments', 'Tabby Public Key', 'string',
      ));
    }
    if (input.tabbySecretKey && input.tabbySecretKey.trim().length > 0) {
      writes.push(this.upsertSetting(
        'tabby_secret_key', input.tabbySecretKey.trim(), 'payments', 'Tabby Secret Key', 'secret',
      ));
    }

    if (input.tamaraEnabled !== undefined) {
      writes.push(this.upsertSetting(
        'tamara_enabled', input.tamaraEnabled ? 'true' : 'false', 'payments', 'Tamara Enabled', 'boolean',
      ));
    }
    if (input.tamaraSandbox !== undefined) {
      writes.push(this.upsertSetting(
        'tamara_sandbox', input.tamaraSandbox ? 'true' : 'false', 'payments', 'Tamara Sandbox Mode', 'boolean',
      ));
    }
    if (input.tamaraApiToken && input.tamaraApiToken.trim().length > 0) {
      writes.push(this.upsertSetting(
        'tamara_api_token', input.tamaraApiToken.trim(), 'payments', 'Tamara API Token', 'secret',
      ));
    }

    await Promise.all(writes);

    // Reinitialize Stripe so new keys / enabled flag take effect immediately.
    const stripeKeysChanged =
      input.stripeEnabled !== undefined ||
      (input.stripeSecretKey && input.stripeSecretKey.trim().length > 0) ||
      (input.stripePublishableKey && input.stripePublishableKey.trim().length > 0);
    if (stripeKeysChanged) {
      try {
        await this.stripeService.reinitialize();
      } catch (e) {
        this.logger.warn(`Stripe reinitialize after settings save failed: ${(e as Error).message}`);
      }
    }

    this.logger.log(
      `Payments config saved: cod=${input.codEnabled}, stripe=${input.stripeEnabled}, tabby=${input.tabbyEnabled}, tamara=${input.tamaraEnabled}, tamaraSandbox=${input.tamaraSandbox}`,
    );
  }
}
