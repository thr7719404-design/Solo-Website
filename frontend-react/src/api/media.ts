import api from './client';
import type { MediaUploadResult, MediaFile } from '@/types';

export const mediaApi = {
  async uploadFile(file: File, folder?: string): Promise<MediaUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);

    const { data } = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteFile(fileUrl: string): Promise<void> {
    await api.delete('/media', { params: { url: fileUrl } });
  },

  async listFiles(folder?: string, limit = 50): Promise<MediaFile[]> {
    const { data } = await api.get('/media', {
      params: {
        ...(folder ? { folder } : {}),
        limit,
      },
    });
    const list = Array.isArray(data) ? data : (data.files ?? []);
    return list;
  },
};
