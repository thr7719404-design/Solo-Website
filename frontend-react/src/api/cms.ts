import api from './client';

export interface HomeSection {
  id: string;
  homePageId: string;
  type: string;
  title?: string | null;
  subtitle?: string | null;
  position: number;
  isEnabled: boolean;
  config: Record<string, unknown>;
}

export interface HomePageConfig {
  id: string;
  key: string;
  announcement_enabled: boolean;
  announcement_text?: string | null;
  sections: HomeSection[];
}

export interface CategoryLandingSection {
  id: string;
  landingId: string;
  type: string;
  title?: string | null;
  position: number;
  isEnabled: boolean;
  config: Record<string, unknown>;
}

export interface CategoryLanding {
  id: string;
  categoryId: string;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  heroImageMobileUrl?: string | null;
  ctaLabel?: string | null;
  ctaTargetType?: string | null;
  ctaTargetValue?: string | null;
  isHeroEnabled: boolean;
  sections: CategoryLandingSection[];
}

export const cmsApi = {
  // ── Home ──
  getHome: () => api.get<HomePageConfig>('/cms/admin/home').then((r) => r.data),
  createHomeSection: (data: Partial<HomeSection> & { type: string; position: number }) =>
    api.post<HomeSection>('/cms/admin/home/sections', data).then((r) => r.data),
  updateHomeSection: (id: string, data: Partial<HomeSection>) =>
    api.patch<HomeSection>(`/cms/admin/home/sections/${id}`, data).then((r) => r.data),
  removeHomeSection: (id: string) =>
    api.delete(`/cms/admin/home/sections/${id}`).then((r) => r.data),
  reorderHomeSections: (orders: { id: string; position: number }[]) =>
    api.post('/cms/admin/home/sections/reorder', { orders }).then((r) => r.data),

  // ── Category landings ──
  listLandings: () =>
    api.get<CategoryLanding[]>('/cms/admin/category-landings').then((r) => r.data),
  getLanding: (id: string) =>
    api.get<CategoryLanding>(`/cms/admin/category-landings/${id}`).then((r) => r.data),
  createLanding: (data: Partial<CategoryLanding> & { categoryId: string }) =>
    api.post<CategoryLanding>('/cms/admin/category-landings', data).then((r) => r.data),
  updateLanding: (id: string, data: Partial<CategoryLanding>) =>
    api.patch<CategoryLanding>(`/cms/admin/category-landings/${id}`, data).then((r) => r.data),
  removeLanding: (id: string) =>
    api.delete(`/cms/admin/category-landings/${id}`).then((r) => r.data),

  createLandingSection: (landingId: string, data: Partial<CategoryLandingSection> & { type: string; position: number }) =>
    api.post<CategoryLandingSection>(`/cms/admin/category-landings/${landingId}/sections`, data).then((r) => r.data),
  updateLandingSection: (id: string, data: Partial<CategoryLandingSection>) =>
    api.patch<CategoryLandingSection>(`/cms/admin/category-sections/${id}`, data).then((r) => r.data),
  removeLandingSection: (id: string) =>
    api.delete(`/cms/admin/category-sections/${id}`).then((r) => r.data),
  reorderLandingSections: (landingId: string, orders: { id: string; position: number }[]) =>
    api.post(`/cms/admin/category-landings/${landingId}/sections/reorder`, { orders }).then((r) => r.data),
};
