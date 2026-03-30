import api from './client';
import type { FavoriteDto } from '../types';

export const favoritesApi = {
  getAll: () =>
    api.get<FavoriteDto[]>('/favorites').then(r => r.data),

  getIds: () =>
    api.get<string[]>('/favorites/ids').then(r => r.data),

  toggle: (productId: string) =>
    api.post(`/favorites/${productId}/toggle`).then(r => r.data),

  add: (productId: string) =>
    api.post(`/favorites/${productId}`).then(r => r.data),

  remove: (productId: string) =>
    api.delete(`/favorites/${productId}`).then(r => r.data),
};
