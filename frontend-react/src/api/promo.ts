import api from './client';
import type { ValidatePromoRequest, PromoValidationResult } from '@/types';

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  startsAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoListResult {
  data: PromoCode[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePromoCodeBody {
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  isActive?: boolean;
  startsAt: string;
  expiresAt?: string;
}

export type UpdatePromoCodeBody = Partial<Omit<CreatePromoCodeBody, 'code'>>;

export const promoApi = {
  async validate(body: ValidatePromoRequest): Promise<PromoValidationResult> {
    const { data } = await api.post('/promo-codes/validate', body);
    return data;
  },

  async list(page = 1, limit = 20): Promise<PromoListResult> {
    const { data } = await api.get('/promo-codes', { params: { page, limit } });
    return {
      data: data.data ?? data.items ?? [],
      total: data.total ?? 0,
      page: data.page ?? page,
      limit: data.limit ?? limit,
    };
  },

  async get(id: string): Promise<PromoCode> {
    const { data } = await api.get(`/promo-codes/${encodeURIComponent(id)}`);
    return data;
  },

  async create(body: CreatePromoCodeBody): Promise<PromoCode> {
    const { data } = await api.post('/promo-codes', body);
    return data;
  },

  async update(id: string, body: UpdatePromoCodeBody): Promise<PromoCode> {
    const { data } = await api.put(`/promo-codes/${encodeURIComponent(id)}`, body);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/promo-codes/${encodeURIComponent(id)}`);
  },
};
