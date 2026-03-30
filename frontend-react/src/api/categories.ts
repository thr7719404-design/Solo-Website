import api from './client';
import type { CategoryDto } from '../types';

export const categoriesApi = {
  getAll: (params?: { includeSubcategories?: boolean; includeProducts?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.includeSubcategories) query.set('includeSubcategories', 'true');
    if (params?.includeProducts) query.set('includeProducts', 'true');
    return api.get<CategoryDto[]>(`/categories?${query}`).then(r => r.data);
  },

  getById: (id: string) =>
    api.get<CategoryDto>(`/categories/${id}`).then(r => r.data),

  create: (data: Partial<CategoryDto>) =>
    api.post<CategoryDto>('/categories', data).then(r => r.data),

  update: (id: string, data: Partial<CategoryDto>) =>
    api.patch<CategoryDto>(`/categories/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/categories/${id}`),

  reorder: (orders: Array<{ id: string; displayOrder: number }>) =>
    api.post('/categories/reorder', { orders }),
};
