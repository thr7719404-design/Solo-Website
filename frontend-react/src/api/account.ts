import api from './client';
import type { AddressDto, LoyaltyDto, PaymentMethodDto, OrderDto } from '../types';

export const accountApi = {
  getProfile: () =>
    api.get('/account/profile').then(r => r.data),

  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) =>
    api.patch('/account/profile', data).then(r => r.data),

  getOrders: () =>
    api.get<OrderDto[]>('/account/orders').then(r => r.data),

  getOrder: (id: string) =>
    api.get<OrderDto>(`/account/orders/${id}`).then(r => r.data),

  downloadInvoice: (id: string, orderNumber?: string) =>
    api.get(`/orders/${id}/invoice/pdf`, { responseType: 'blob' }).then(r => {
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

  getAddresses: () =>
    api.get<AddressDto[]>('/account/addresses').then(r => r.data),

  createAddress: (data: Partial<AddressDto>) =>
    api.post<AddressDto>('/account/addresses', stripAddress(data)).then(r => r.data),

  updateAddress: (id: string, data: Partial<AddressDto>) =>
    api.patch<AddressDto>(`/account/addresses/${id}`, stripAddress(data)).then(r => r.data),

  deleteAddress: (id: string) =>
    api.delete(`/account/addresses/${id}`),

  setDefaultAddress: (id: string) =>
    api.patch(`/account/addresses/${id}/default`).then(r => r.data),

  getLoyalty: () =>
    api.get<LoyaltyDto>('/account/loyalty').then(r => r.data),

  getPaymentMethods: () =>
    api.get<PaymentMethodDto[]>('/account/payment-methods').then(r => r.data),

  addPaymentMethod: (data: Record<string, unknown>) =>
    api.post('/account/payment-methods', data).then(r => r.data),

  setDefaultPayment: (id: string) =>
    api.patch(`/account/payment-methods/${id}/default`).then(r => r.data),

  deletePaymentMethod: (id: string) =>
    api.delete(`/account/payment-methods/${id}`),
};

function stripAddress(d: Partial<AddressDto>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const allowed = ['label','firstName','lastName','addressLine1','addressLine2','city','postalCode','phone','isDefault'];
  for (const k of allowed) {
    const v = (d as any)[k];
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '' && k !== 'firstName' && k !== 'lastName' && k !== 'addressLine1' && k !== 'city') continue;
    if (k === 'phone' && typeof v === 'string') {
      // Force numeric-only with optional leading +
      const trimmed = v.trim();
      const hasPlus = trimmed.startsWith('+');
      const digits = trimmed.replace(/[^0-9]/g, '');
      const sanitized = (hasPlus ? '+' : '') + digits;
      if (sanitized === '' || sanitized === '+') continue;
      out[k] = sanitized;
      continue;
    }
    out[k] = typeof v === 'string' ? v.trim() : v;
  }
  return out;
}
