import api from './client';

export interface BulkOrderItem {
  productId: number;
  productName: string;
  sku?: string;
  quantity: number;
  price?: number;
}

export interface CreateBulkOrderPayload {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  items: BulkOrderItem[];
}

export interface BulkOrderRequest {
  id: string;
  orderNumber: number;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  status: 'NEW' | 'IN_PROGRESS' | 'CLOSED';
  adminNotes: string | null;
  confirmationEmailSent?: boolean;
  createdAt: string;
  updatedAt: string;
  items: (BulkOrderItem & { id: string })[];
}

export const bulkOrdersApi = {
  async submit(payload: CreateBulkOrderPayload): Promise<BulkOrderRequest> {
    // Strip price from items — backend determines pricing
    const cleaned = {
      ...payload,
      items: payload.items.map(({ price, ...rest }) => rest),
    };
    const { data } = await api.post('/bulk-orders', cleaned);
    return data;
  },

  async searchProducts(query: string): Promise<any[]> {
    const { data } = await api.get('/products', {
      params: { search: query, limit: 10 },
    });
    return data.data || data.products || data.items || data;
  },

  async getProductsByCategory(categoryId: number, isSubcategory = false): Promise<any[]> {
    const params: Record<string, any> = { limit: 50 };
    if (isSubcategory) {
      params.subcategoryId = categoryId;
    } else {
      params.categoryId = categoryId;
    }
    const { data } = await api.get('/products', { params });
    return data.data || data.products || data.items || data;
  },

  async getDefaultProducts(): Promise<any[]> {
    const { data } = await api.get('/products', {
      params: { limit: 20 },
    });
    return data.data || data.products || data.items || data;
  },

  // Admin
  async getAll(params?: { page?: number; limit?: number; status?: string }): Promise<{
    items: BulkOrderRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { data } = await api.get('/bulk-orders/admin', { params });
    return data;
  },

  async getOne(id: string): Promise<BulkOrderRequest> {
    const { data } = await api.get(`/bulk-orders/admin/${id}`);
    return data;
  },

  async updateStatus(
    id: string,
    status: 'NEW' | 'IN_PROGRESS' | 'CLOSED',
    adminNotes?: string,
  ): Promise<BulkOrderRequest> {
    const { data } = await api.patch(`/bulk-orders/admin/${id}`, { status, adminNotes });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/bulk-orders/admin/${id}`);
  },
};
