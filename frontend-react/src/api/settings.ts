import api from './client';

export interface VatConfig {
  vatPercent: number;
  isEnabled: boolean;
  label: string;
}

export interface SaveVatConfigBody {
  vatPercent: number;
  isEnabled?: boolean;
  label?: string;
}

export interface LoyaltyConfig {
  earnPercent: number;
  maxRedeemPercent: number;
  isEnabled: boolean;
}

export interface SaveLoyaltyConfigBody {
  earnPercent: number;
  maxRedeemPercent?: number;
  isEnabled?: boolean;
}

export interface ShippingConfig {
  fee: number;
  label: string;
  /** Free shipping when subtotal >= this AED amount. 0 = disabled. */
  freeShippingThreshold: number;
}

export interface SaveShippingConfigBody {
  fee: number;
  label?: string;
  freeShippingThreshold?: number;
}

export const settingsApi = {
  async getVatConfig(): Promise<VatConfig> {
    const { data } = await api.get('/settings/admin/vat');
    return data;
  },

  async saveVatConfig(body: SaveVatConfigBody): Promise<void> {
    await api.post('/settings/admin/vat', body);
  },

  async getLoyaltyConfig(): Promise<LoyaltyConfig> {
    const { data } = await api.get('/settings/admin/loyalty');
    return data;
  },

  async saveLoyaltyConfig(body: SaveLoyaltyConfigBody): Promise<void> {
    await api.post('/settings/admin/loyalty', body);
  },

  async getShippingConfig(): Promise<ShippingConfig> {
    const { data } = await api.get('/settings/admin/shipping');
    return data;
  },

  async saveShippingConfig(body: SaveShippingConfigBody): Promise<void> {
    await api.post('/settings/admin/shipping', body);
  },

  async getPublicShippingConfig(): Promise<ShippingConfig> {
    const { data } = await api.get('/settings/shipping');
    return data;
  },

  async getPaymentsConfig(): Promise<PaymentsConfig> {
    const { data } = await api.get('/settings/admin/payments');
    return data;
  },

  async savePaymentsConfig(body: SavePaymentsConfigBody): Promise<void> {
    await api.post('/settings/admin/payments', body);
  },
};

export interface PaymentsConfig {
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
}

export interface SavePaymentsConfigBody {
  codEnabled?: boolean;
  stripeEnabled?: boolean;
  /** Send only when changing — empty / omitted preserves existing key. */
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  tabbyEnabled?: boolean;
  /** Send only when changing — empty / omitted preserves existing key. */
  tabbyPublicKey?: string;
  tabbySecretKey?: string;
  tamaraEnabled?: boolean;
  tamaraSandbox?: boolean;
  tamaraApiToken?: string;
}
