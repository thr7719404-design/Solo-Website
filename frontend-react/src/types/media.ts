// ============================================================================
// Media Types — matches NestJS backend /media/*
// ============================================================================

export interface MediaUploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
  mimetype: string;
}

export interface MediaFile {
  key: string;
  url: string;
  size: number;
  lastModified: string;
}
