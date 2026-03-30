import api from './client';
import type { ProductDto, PaginatedResponse } from '../types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock?: boolean;
  status?: string;
}

export const productsApi = {
  getAll: (filters: ProductFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(`${key}[]`, v));
        } else {
          params.set(key, String(value));
        }
      }
    });
    return api.get<{ data: ProductDto[]; total: number; page: number; limit: number; totalPages: number }>(`/products?${params}`)
      .then(r => ({
        items: r.data.data,
        total: r.data.total,
        page: r.data.page,
        limit: r.data.limit,
        totalPages: r.data.totalPages,
      }));
  },

  getById: (id: string) =>
    api.get<ProductDto>(`/products/${id}`).then(r => r.data),

  getFeatured: (limit = 8) =>
    api.get<{ data: ProductDto[] }>(`/products/featured?limit=${limit}`).then(r => r.data.data),

  getBestSellers: (limit = 8) =>
    api.get<{ data: ProductDto[] }>(`/products/best-sellers?limit=${limit}`).then(r => r.data.data),

  getNewArrivals: (limit = 8) =>
    api.get<{ data: ProductDto[] }>(`/products/new-arrivals?limit=${limit}`).then(r => r.data.data),

  getRelated: (id: string, limit = 4) =>
    api.get<{ data: ProductDto[] }>(`/products/${id}/related?limit=${limit}`).then(r => r.data.data ?? r.data as unknown as ProductDto[]),

  create: (data: Partial<ProductDto>) =>
    api.post<ProductDto>('/products', data).then(r => r.data),

  update: (id: string, data: Partial<ProductDto>) =>
    api.patch<ProductDto>(`/products/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/products/${id}`),
};
