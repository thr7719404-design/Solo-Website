import api from './client';

export type CollectionStrategy = 'MANUAL' | 'AUTO';

export interface CollectionItem {
  id: string;
  collectionId: string;
  productId: number;
  sortOrder: number;
}

export interface ProductCollection {
  id: string;
  key: string;
  title: string;
  subtitle?: string | null;
  strategy: CollectionStrategy;
  ruleJson?: string | null;
  limit: number;
  sortOrder: number;
  isActive: boolean;
  items?: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export const collectionsApi = {
  list: () =>
    api.get<ProductCollection[]>('/collections/admin').then((r) => r.data),
  get: (id: string) =>
    api.get<ProductCollection>(`/collections/admin/${id}`).then((r) => r.data),
  create: (data: Partial<ProductCollection>) =>
    api.post<ProductCollection>('/collections/admin', data).then((r) => r.data),
  update: (id: string, data: Partial<ProductCollection>) =>
    api.patch<ProductCollection>(`/collections/admin/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/collections/admin/${id}`).then((r) => r.data),

  addItem: (collectionId: string, productId: number, sortOrder = 0) =>
    api.post<CollectionItem>(`/collections/admin/${collectionId}/items`, { productId, sortOrder }).then((r) => r.data),
  removeItem: (collectionId: string, productId: number) =>
    api.delete(`/collections/admin/${collectionId}/items/${productId}`).then((r) => r.data),
  reorderItems: (collectionId: string, orders: { id: string; sortOrder: number }[]) =>
    api.post(`/collections/admin/${collectionId}/items/reorder`, { orders }).then((r) => r.data),
};
