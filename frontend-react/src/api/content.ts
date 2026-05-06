import api from './client';
import type { HomePageDto, BannerDto, LandingPageDto, LandingSectionDto } from '../types';

export const contentApi = {
  getHome: () =>
    api.get<HomePageDto>('/content/home').then(r => r.data),

  getBanners: (placement?: string) => {
    const query = placement ? `?placement=${placement}` : '';
    return api.get<BannerDto[]>(`/content/banners${query}`).then(r => r.data);
  },

  getPage: (slug: string) =>
    api.get<LandingPageDto>(`/content/pages/${slug}`).then(r => r.data),

  getLandingPage: (slug: string) =>
    api.get<LandingPageDto>(`/content/pages/${slug}`).then(r => r.data),

  // Admin
  getAllBanners: () =>
    api.get<BannerDto[]>('/content/banners/all').then(r => r.data),

  getAllPages: () =>
    api.get<LandingPageDto[]>('/content/pages').then(r => r.data),

  getPageById: (id: string) =>
    api.get<LandingPageDto>(`/content/admin/pages/${id}`).then(r => r.data),

  createBanner: (data: Partial<BannerDto>) =>
    api.post<BannerDto>('/content/banners', data).then(r => r.data),

  updateBanner: (id: string, data: Partial<BannerDto>) =>
    api.patch<BannerDto>(`/content/banners/${id}`, data).then(r => r.data),

  deleteBanner: (id: string) =>
    api.delete(`/content/banners/${id}`),

  createPage: (data: Partial<LandingPageDto>) =>
    api.post<LandingPageDto>('/content/pages', data).then(r => r.data),

  updatePage: (id: string, data: Partial<LandingPageDto>) =>
    api.patch<LandingPageDto>(`/content/pages/${id}`, data).then(r => r.data),

  deletePage: (id: string) =>
    api.delete(`/content/pages/${id}`),

  createSection: (pageId: string, data: Partial<LandingSectionDto>) =>
    api.post(`/content/pages/${pageId}/sections`, data).then(r => r.data),

  updateSection: (sectionId: string, data: Partial<LandingSectionDto>) =>
    api.patch(`/content/sections/${sectionId}`, data).then(r => r.data),

  deleteSection: (sectionId: string) =>
    api.delete(`/content/sections/${sectionId}`),

  reorderSections: (pageId: string, orders: Array<{ id: string; displayOrder: number }>) =>
    api.post(`/content/pages/${pageId}/sections/reorder`, { orders }).then(r => r.data),
};
