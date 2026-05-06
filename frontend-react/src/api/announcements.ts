import api from './client';

export interface AnnouncementDto {
  id: string;
  text: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
}

export interface AnnouncementFull extends AnnouncementDto {
  isActive: boolean;
  sortOrder: number;
  promoCodeId: string | null;
  promoCode?: {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
    value: number;
    minOrderAmount?: number;
    isActive: boolean;
  } | null;
  startsAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const announcementsApi = {
  /** Public — get active announcements for the banner */
  getActive: () =>
    api.get<AnnouncementDto[]>('/announcements/active').then((r) => r.data),

  /** Admin — list promo codes for dropdown */
  getPromoCodes: () =>
    api.get<{ id: string; code: string; type: string; value: number; minOrderAmount: number | null; isActive: boolean; startsAt: string; expiresAt: string | null }[]>('/admin/announcements/promo-codes-list').then((r) => r.data),

  /** Admin — list all */
  getAll: () =>
    api.get<AnnouncementFull[]>('/admin/announcements').then((r) => r.data),

  /** Admin — get one */
  getById: (id: string) =>
    api.get<AnnouncementFull>(`/admin/announcements/${id}`).then((r) => r.data),

  /** Admin — create */
  create: (data: Partial<AnnouncementFull>) =>
    api.post<AnnouncementFull>('/admin/announcements', data).then((r) => r.data),

  /** Admin — update */
  update: (id: string, data: Partial<AnnouncementFull>) =>
    api.patch<AnnouncementFull>(`/admin/announcements/${id}`, data).then((r) => r.data),

  /** Admin — delete */
  remove: (id: string) =>
    api.delete(`/admin/announcements/${id}`).then((r) => r.data),
};
