/**
 * Storage Provider Interface
 * Abstract interface for file storage (local, S3, GCS, etc.)
 */
export interface IStorageProvider {
  /**
   * Upload a file to storage
   * @param file File buffer or stream
   * @param filename Destination filename
   * @param options Upload options (mimetype, folder, etc.)
   * @returns Public URL of uploaded file
   */
  upload(
    file: Buffer | NodeJS.ReadableStream,
    filename: string,
    options?: UploadOptions,
  ): Promise<string>;

  /**
   * Delete a file from storage
   * @param url Public URL or file key
   */
  delete(url: string): Promise<void>;

  /**
   * Get file URL (useful for signed URLs in S3)
   * @param filename File key or path
   * @param options URL options
   */
  getUrl(filename: string, options?: GetUrlOptions): Promise<string>;
}

export interface UploadOptions {
  mimetype?: string;
  folder?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}

export interface GetUrlOptions {
  expiresIn?: number; // seconds
  download?: boolean;
}
