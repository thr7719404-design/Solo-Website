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

  getAddresses: () =>
    api.get<AddressDto[]>('/account/addresses').then(r => r.data),

  createAddress: (data: Partial<AddressDto>) =>
    api.post<AddressDto>('/account/addresses', data).then(r => r.data),

  updateAddress: (id: string, data: Partial<AddressDto>) =>
    api.patch<AddressDto>(`/account/addresses/${id}`, data).then(r => r.data),

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
