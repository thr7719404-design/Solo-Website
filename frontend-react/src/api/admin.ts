import api from './client';
import type { DashboardStatsDto, OrderDto } from '../types';

export const adminApi = {
  getStats: () =>
    api.get<DashboardStatsDto>('/admin/stats').then(r => r.data),

  getOrders: (params?: { status?: string; page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.set(k, String(v));
      });
    }
    return api.get(`/admin/orders?${query}`)
      .then(r => {
        const body = r.data as Record<string, unknown>;
        return { items: (body.data ?? body.items ?? []) as OrderDto[], total: (body.total ?? 0) as number };
      });
  },

  getOrder: (id: string) =>
    api.get<OrderDto>(`/admin/orders/${id}`).then(r => r.data),

  updateOrderStatus: (id: string, data: { status: string; notes?: string; trackingNumber?: string }) =>
    api.patch(`/admin/orders/${id}/status`, data).then(r => r.data),

  getReports: (days = 30) =>
    api.get(`/admin/reports?days=${days}`).then(r => r.data),
};

export const mediaApi = {
  upload: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  delete: (url: string) =>
    api.delete(`/media?url=${encodeURIComponent(url)}`),

  list: (folder?: string, limit?: number) => {
    const query = new URLSearchParams();
    if (folder) query.set('folder', folder);
    if (limit) query.set('limit', String(limit));
    return api.get(`/media?${query}`).then(r => r.data);
  },
};
