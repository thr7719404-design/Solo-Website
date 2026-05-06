import api from './client';

export interface NavigationMenuItem {
  id: string;
  menuId: string;
  parentId?: string | null;
  label: string;
  url?: string | null;
  icon?: string | null;
  badge?: string | null;
  badgeColor?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  openInNewTab: boolean;
  sortOrder: number;
  isActive: boolean;
  children?: NavigationMenuItem[];
}

export interface NavigationMenu {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  items?: NavigationMenuItem[];
  createdAt: string;
  updatedAt: string;
}

export const navigationApi = {
  // ── Public storefront ──
  getMenuByKey: (key: string) =>
    api.get<NavigationMenu>(`/navigation/menu/${key}`).then((r) => r.data),

  // ── Menus (admin) ──
  getMenus: () =>
    api.get<NavigationMenu[]>('/navigation/admin/menus').then((r) => r.data),
  getMenu: (id: string) =>
    api.get<NavigationMenu>(`/navigation/admin/menus/${id}`).then((r) => r.data),
  createMenu: (data: Partial<NavigationMenu>) =>
    api.post<NavigationMenu>('/navigation/admin/menus', data).then((r) => r.data),
  updateMenu: (id: string, data: Partial<NavigationMenu>) =>
    api.patch<NavigationMenu>(`/navigation/admin/menus/${id}`, data).then((r) => r.data),
  removeMenu: (id: string) =>
    api.delete(`/navigation/admin/menus/${id}`).then((r) => r.data),

  // ── Items ──
  createItem: (data: Partial<NavigationMenuItem>) =>
    api.post<NavigationMenuItem>('/navigation/admin/items', data).then((r) => r.data),
  updateItem: (id: string, data: Partial<NavigationMenuItem>) =>
    api.patch<NavigationMenuItem>(`/navigation/admin/items/${id}`, data).then((r) => r.data),
  removeItem: (id: string) =>
    api.delete(`/navigation/admin/items/${id}`).then((r) => r.data),

  reorderItems: (menuId: string, orders: { id: string; sortOrder: number }[]) =>
    api.post(`/navigation/admin/menus/${menuId}/reorder`, { orders }).then((r) => r.data),
};
