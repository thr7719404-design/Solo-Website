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

  updateOrderStatus: (id: string, data: { status: string; notes?: string; trackingNumber?: string }) =>
    api.patch(`/admin/orders/${id}/status`, data).then(r => r.data),

  getReports: (days = 30) =>
    api.get<FullReportDto>(`/admin/reports?days=${days}`).then(r => r.data),

  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    userEmail?: string;
    action?: string;
    entityType?: string;
    from?: string;
    to?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.set(k, String(v));
      });
    }
    return api.get(`/admin/audit-logs?${query}`).then(r => r.data);
  },
};

export const mediaApi = {
  upload: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': undefined },
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

export interface VariantAttributeDto {
  id: string;
  key: string;
  value: string;
  colorHex?: string | null;
}

export interface ProductGroupVariantDto {
  id: number;
  sku: string;
  slug: string;
  productName: string;
  variantAttributes: Record<string, any> | null;
  variantSortOrder: number;
  isDefaultVariant: boolean;
  stockQty: number;
  variantAttrs?: VariantAttributeDto[];
}

export interface ProductGroupDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  tags?: string[];
  variantAxes: string[];
  products?: ProductGroupVariantDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AttributeInput {
  key: string;
  value: string;
  colorHex?: string | null;
}

export interface CreateGroupInput {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  tags?: string[];
  variantAxes?: string[];
  productIds?: number[];
}

export interface UpdateGroupInput {
  name?: string;
  slug?: string;
  description?: string;
  category?: string;
  tags?: string[];
  variantAxes?: string[];
  productIds?: number[];
}

export interface AddVariantInput {
  productId: number;
  attributes?: AttributeInput[];
  isDefault?: boolean;
  variantSortOrder?: number;
}

export interface AutoGroupInput {
  skus: string[];
  groupName: string;
  slug?: string;
  category?: string;
  variantAxes?: string[];
}

export interface AutoGroupByNameResult {
  groupsCreated: number;
  productsLinked: number;
  ungroupedProducts: number;
  skippedBaseNames: string[];
  dryRun: boolean;
}

export const productGroupsApi = {
  list: () => api.get<{ data: ProductGroupDto[]; count: number }>('/admin/product-groups').then(r => r.data),
  get: (id: string) => api.get<ProductGroupDto>(`/admin/product-groups/${id}`).then(r => r.data),
  getBySlug: (slug: string) =>
    api.get<ProductGroupDto>(`/admin/product-groups/by-slug/${slug}`).then(r => r.data),
  create: (data: CreateGroupInput) =>
    api.post<ProductGroupDto>('/admin/product-groups', data).then(r => r.data),
  update: (id: string, data: UpdateGroupInput) =>
    api.patch<ProductGroupDto>(`/admin/product-groups/${id}`, data).then(r => r.data),
  remove: (id: string) => api.delete(`/admin/product-groups/${id}`).then(r => r.data),

  addVariant: (groupId: string, data: AddVariantInput) =>
    api.post<ProductGroupDto>(`/admin/product-groups/${groupId}/add-variant`, data).then(r => r.data),
  removeVariant: (groupId: string, productId: number) =>
    api.delete<ProductGroupDto>(`/admin/product-groups/${groupId}/remove-variant/${productId}`).then(r => r.data),
  setDefault: (groupId: string, productId: number) =>
    api.post<ProductGroupDto>(`/admin/product-groups/${groupId}/set-default/${productId}`).then(r => r.data),

  autoGroup: (data: AutoGroupInput) =>
    api.post<ProductGroupDto>('/admin/product-groups/auto-group', data).then(r => r.data),
  autoGroupByName: (dryRun: boolean) =>
    api.post<AutoGroupByNameResult>(
      `/admin/product-groups/auto-group-by-name?dryRun=${dryRun ? 'true' : 'false'}`,
    ).then(r => r.data),

  setProductVariant: (
    productId: number,
    data: {
      productGroupId: string | null;
      variantAttributes?: Record<string, any> | null;
      variantSortOrder?: number;
    },
  ) => api.patch(`/admin/product-groups/products/${productId}`, data).then(r => r.data),
};
