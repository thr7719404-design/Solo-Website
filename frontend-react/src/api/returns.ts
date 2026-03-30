import api from './client';

export interface ReturnItemDto {
  id: string;
  orderItemId: string;
  productId: number | null;
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ReturnDto {
  id: string;
  returnNumber: string;
  orderId: string;
  userId: string;
  status: string;
  reason: string;
  customerNotes: string | null;
  adminNotes: string | null;
  refundMethod: string;
  refundAmount: number;
  loyaltyDeducted: number | null;
  stockRestored: boolean;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  receivedAt: string | null;
  completedAt: string | null;
  items: ReturnItemDto[];
  order?: { orderNumber: string; createdAt?: string; total?: number };
  user?: { id: string; email: string; firstName: string; lastName: string };
}

export interface ReturnStatsDto {
  requested: number;
  approved: number;
  processing: number;
  completed: number;
  total: number;
}

export interface CreateReturnRequest {
  orderId: string;
  reason: string;
  customerNotes?: string;
  items: { orderItemId: string; quantity: number }[];
}

export interface AdminUpdateReturnRequest {
  status: string;
  adminNotes?: string;
  refundMethod?: string;
  refundAmount?: number;
}

// ── Customer endpoints ──
export const returnsApi = {
  create: (data: CreateReturnRequest) =>
    api.post<ReturnDto>('/returns', data).then(r => r.data),

  getAll: () =>
    api.get<ReturnDto[]>('/returns').then(r => r.data),

  getById: (id: string) =>
    api.get<ReturnDto>(`/returns/${id}`).then(r => r.data),

  cancel: (id: string) =>
    api.delete<ReturnDto>(`/returns/${id}`).then(r => r.data),
};

// ── Admin endpoints ──
export const adminReturnsApi = {
  getAll: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.set(k, String(v));
      });
    }
    return api.get(`/admin/returns?${query}`).then(r => r.data as {
      data: ReturnDto[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    });
  },

  getStats: () =>
    api.get<ReturnStatsDto>('/admin/returns/stats').then(r => r.data),

  getById: (id: string) =>
    api.get<ReturnDto>(`/admin/returns/${id}`).then(r => r.data),

  update: (id: string, data: AdminUpdateReturnRequest) =>
    api.patch<ReturnDto>(`/admin/returns/${id}`, data).then(r => r.data),
};
