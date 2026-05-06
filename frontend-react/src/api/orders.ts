import api from './client';
import type { OrderDto } from '../types';

export const ordersApi = {
  create: (data: Record<string, unknown>) =>
    api.post<OrderDto>('/orders', data).then(r => r.data),
};
