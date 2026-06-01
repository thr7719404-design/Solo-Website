import api from './client';
import type { DashboardStatsDto, OrderDto, FullReportDto } from '../types';

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
        const meta = (body.meta ?? {}) as Record<string, unknown>;
        return { items: (body.data ?? body.items ?? []) as OrderDto[], total: (meta.total ?? body.total ?? 0) as number };
      });
  },

  getOrder: (id: string) =>
    api.get<OrderDto>(`/admin/orders/${id}`).then(r => r.data),

  downloadInvoice: (id: string, orderNumber?: string) =>
    api.get(`/admin/orders/${id}/invoice/pdf`, { responseType: 'blob' }).then(r => {
      const blob = new Blob([r.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderNumber || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }),

  updateOrderStatus: (id: string, data: { status: string; notes?: string; trackingNumber?: string }) =>
    api.patch(`/admin/orders/${id}/status`, data).then(r => r.data),

  getReports: (days = 30) =>
    api.get<FullReportDto>(`/admin/reports?days=${days}`).then(r => r.data),

  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    userEmail?: string;
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    from?: string;
    to?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      });
    }
    const qs = query.toString();
    return api.get<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(
      `/admin/audit-logs${qs ? `?${qs}` : ''}`,
    ).then(r => r.data);
  },
};

// ── Product Groups ─────────────────────────────────────────────────────────

export interface AttributeInput {
  key: string;
  value: string;
  colorHex?: string | null;
}

export interface ProductGroupVariantDto {
  id: number;
  sku?: string;
  name?: string;
  slug?: string;
  imageUrl?: string | null;
  attributes?: AttributeInput[];
  isDefault?: boolean;
  variantSortOrder?: number;
}

export interface ProductGroupDto {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  tags?: string[];
  variantAxes?: string[];
  products?: ProductGroupVariantDto[];
  createdAt?: string;
  updatedAt?: string;
}

export const productGroupsApi = {
  list: (): Promise<ProductGroupDto[]> =>
    api.get('/admin/product-groups').then(r => r.data),

  get: (id: string): Promise<ProductGroupDto> =>
    api.get(`/admin/product-groups/${id}`).then(r => r.data),

  create: (dto: {
    name: string;
    slug?: string;
    description?: string;
    category?: string;
    tags?: string[];
    variantAxes?: string[];
    productIds?: number[];
  }): Promise<ProductGroupDto> =>
    api.post('/admin/product-groups', dto).then(r => r.data),

  update: (id: string, dto: {
    name?: string;
    slug?: string;
    description?: string;
    category?: string;
    tags?: string[];
    variantAxes?: string[];
    productIds?: number[];
  }): Promise<ProductGroupDto> =>
    api.patch(`/admin/product-groups/${id}`, dto).then(r => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/admin/product-groups/${id}`).then(r => r.data),

  addVariant: (groupId: string, dto: {
    productId: number;
    attributes?: AttributeInput[];
    isDefault?: boolean;
    variantSortOrder?: number;
  }): Promise<ProductGroupDto> =>
    api.post(`/admin/product-groups/${groupId}/add-variant`, dto).then(r => r.data),

  removeVariant: (groupId: string, productId: number): Promise<void> =>
    api.delete(`/admin/product-groups/${groupId}/remove-variant/${productId}`).then(r => r.data),

  setDefault: (groupId: string, productId: number): Promise<void> =>
    api.post(`/admin/product-groups/${groupId}/set-default/${productId}`, {}).then(r => r.data),

  setProductVariant: (productId: number, dto: {
    productGroupId: string | null;
    variantAttributes?: Record<string, unknown> | null;
    variantSortOrder?: number;
  }): Promise<void> =>
    api.patch(`/admin/product-groups/products/${productId}`, dto).then(r => r.data),

  autoGroup: (dto: {
    skus: string[];
    groupName: string;
    slug?: string;
    category?: string;
    variantAxes?: string[];
  }): Promise<ProductGroupDto> =>
    api.post('/admin/product-groups/auto-group', dto).then(r => r.data),

  autoGroupByName: (dryRun = false): Promise<unknown> =>
    api.post(`/admin/product-groups/auto-group-by-name?dryRun=${dryRun}`, {}).then(r => r.data),
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
