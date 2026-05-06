import api from './client';

export interface SubcategoryAdminDto {
  id: number;
  categoryId: number;
  name: string;
  name_ar?: string | null;
  slug: string;
  description?: string | null;
  sort_order: number;
  isActive: boolean;
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubcategoryPayload {
  categoryId: number | string;
  name: string;
  name_ar?: string | null;
  slug?: string;
  description?: string | null;
  sort_order?: number;
  isActive?: boolean;
}

export type UpdateSubcategoryPayload = Partial<CreateSubcategoryPayload>;

export const subcategoriesApi = {
  list: (categoryId?: number | string) => {
    const q = categoryId !== undefined && categoryId !== '' ? `?categoryId=${categoryId}` : '';
    return api.get<SubcategoryAdminDto[]>(`/subcategories${q}`).then((r) => r.data);
  },

  get: (id: number | string) =>
    api.get<SubcategoryAdminDto>(`/subcategories/${id}`).then((r) => r.data),

  create: (data: CreateSubcategoryPayload) =>
    api.post<SubcategoryAdminDto>('/subcategories', data).then((r) => r.data),

  update: (id: number | string, data: UpdateSubcategoryPayload) =>
    api.patch<SubcategoryAdminDto>(`/subcategories/${id}`, data).then((r) => r.data),

  remove: (id: number | string) =>
    api.delete(`/subcategories/${id}`).then((r) => r.data),

  reorder: (categoryId: number | string, orderedIds: Array<number | string>) =>
    api.patch('/subcategories/reorder', { categoryId, orderedIds }).then((r) => r.data),
};
