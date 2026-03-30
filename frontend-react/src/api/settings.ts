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
};
