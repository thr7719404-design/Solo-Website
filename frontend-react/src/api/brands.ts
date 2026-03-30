import api from './client';
import type { BrandDto } from '../types';

export const brandsApi = {
  getAll: () =>
    api.get<BrandDto[]>('/brands').then(r => r.data),

  getById: (id: string) =>
    api.get<BrandDto>(`/brands/${id}`).then(r => r.data),

  create: (data: Partial<BrandDto>) =>
    api.post<BrandDto>('/brands', data).then(r => r.data),

  update: (id: string, data: Partial<BrandDto>) =>
    api.patch<BrandDto>(`/brands/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/brands/${id}`),
};
