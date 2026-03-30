import api from './client';
import type { OrderDto } from '../types';

export const ordersApi = {
  create: (data: Record<string, unknown>) =>
    api.post<OrderDto>('/orders', data).then(r => r.data),

  getAll: () =>
    api.get<OrderDto[]>('/orders').then(r => r.data),

  getById: (id: string) =>
    api.get<OrderDto>(`/orders/${id}`).then(r => r.data),
};
