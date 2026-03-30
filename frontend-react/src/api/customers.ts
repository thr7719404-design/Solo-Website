import api from './client';
import type {
  CustomerDto,
  CustomerDetailsDto,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/types';

export interface CustomerListResult {
  data: CustomerDto[];
  total: number;
  page: number;
  limit: number;
}

export const customersApi = {
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    includeInactive?: boolean;
  }): Promise<CustomerListResult> {
    const query: Record<string, string> = {};
    if (params?.page) query.page = String(params.page);
    if (params?.limit) query.limit = String(params.limit);
    if (params?.search) query.search = params.search;
    if (params?.includeInactive) query.includeInactive = 'true';

    const { data } = await api.get('/admin/customers', { params: query });
    const items: CustomerDto[] = (data.data ?? data.items ?? []).map(
      (c: Record<string, unknown>) => {
        const full = (c.fullName as string) ?? '';
        const [first = '', ...rest] = full.split(' ');
        return {
          ...c,
          firstName: (c.firstName as string) ?? first,
          lastName: (c.lastName as string) ?? rest.join(' '),
          orderCount: (c.orderCount as number) ?? (c.ordersCount as number) ?? 0,
        } as CustomerDto;
      },
    );
    return { data: items, total: data.total ?? 0, page: data.page ?? 1, limit: data.limit ?? 20 };
  },

  async getCustomer(id: string): Promise<CustomerDetailsDto> {
    const { data } = await api.get(`/admin/customers/${encodeURIComponent(id)}`);
    return data;
  },

  async createCustomer(body: CreateCustomerRequest) {
    const { data } = await api.post('/admin/customers', body);
    return data;
  },

  async updateCustomer(id: string, body: UpdateCustomerRequest) {
    const { data } = await api.patch(`/admin/customers/${encodeURIComponent(id)}`, body);
    return data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/admin/customers/${encodeURIComponent(id)}`);
  },

  // ── Addresses ────────────────────────────────────────────
  async createAddress(customerId: string, body: Record<string, unknown>) {
    const { data } = await api.post(
      `/admin/customers/${encodeURIComponent(customerId)}/addresses`,
      body,
    );
    return data;
  },

  async updateAddress(addressId: string, body: Record<string, unknown>) {
    const { data } = await api.patch(
      `/admin/customer-addresses/${encodeURIComponent(addressId)}`,
      body,
    );
    return data;
  },

  async deleteAddress(addressId: string): Promise<void> {
    await api.delete(`/admin/customer-addresses/${encodeURIComponent(addressId)}`);
  },

  async setDefaultAddress(addressId: string) {
    const { data } = await api.patch(
      `/admin/customer-addresses/${encodeURIComponent(addressId)}/default`,
      {},
    );
    return data;
  },

  // ── Loyalty ──────────────────────────────────────────────
  async adjustLoyalty(
    customerId: string,
    body: { amountAed: number; description?: string },
  ) {
    const { data } = await api.post(
      `/admin/customers/${encodeURIComponent(customerId)}/loyalty/adjust`,
      body,
    );
    return data;
  },
};
