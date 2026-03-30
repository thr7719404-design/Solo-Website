import api from './client';
import type {
  StripeConfig,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  VerifyPaymentRequest,
} from '@/types';

export interface StripeAdminConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  isEnabled: boolean;
}

export interface SaveStripeConfigBody {
  secretKey: string;
  publishableKey: string;
  webhookSecret?: string;
}

export const stripeApi = {
  async getConfig(): Promise<StripeConfig> {
    const { data } = await api.get('/stripe/config');
    return data;
  },

  async createPaymentIntent(body: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    const { data } = await api.post('/stripe/create-payment-intent', body);
    return data;
  },

  async verifyPayment(body: VerifyPaymentRequest): Promise<Record<string, unknown>> {
    const { data } = await api.post('/stripe/verify-payment', body);
    return data;
  },

  async getAdminConfig(): Promise<StripeAdminConfig> {
    const { data } = await api.get('/stripe/admin/config');
    return data;
  },

  async saveAdminConfig(body: SaveStripeConfigBody): Promise<void> {
    await api.post('/stripe/admin/config', body);
  },
};
