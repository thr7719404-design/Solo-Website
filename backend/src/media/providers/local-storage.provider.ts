import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import {
  IStorageProvider,
  UploadOptions,
  GetUrlOptions,
} from '../interfaces/storage-provider.interface';

/**
 * Local File Storage Provider
 * Stores files in local filesystem (dev/testing only)
 */
@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    // Default to 'uploads' folder in project root
    this.uploadDir = this.configService.get<string>(
      'UPLOAD_DIR',
      join(process.cwd(), 'uploads'),
    );
    // Base URL for serving files (e.g., http://localhost:3000/uploads)
    this.baseUrl =
      this.configService.get<string>('UPLOAD_BASE_URL') ||
      `${this.configService.get<string>('APP_URL', 'http://localhost:3000')}/uploads`;

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      this.logger.log(`Creating upload directory: ${this.uploadDir}`);
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: Buffer | NodeJS.ReadableStream,
    filename: string,
    options?: UploadOptions,
  ): Promise<string> {
    const folder = options?.folder || 'general';
    const folderPath = join(this.uploadDir, folder);

    // Ensure folder exists
    await fs.mkdir(folderPath, { recursive: true });

    const filePath = join(folderPath, filename);

    // Write file
    if (Buffer.isBuffer(file)) {
      await fs.writeFile(filePath, file);
    } else {
      // Handle stream
      const writeStream = require('fs').createWriteStream(filePath);
      await new Promise((resolve, reject) => {
        file.pipe(writeStream);
        file.on('end', resolve);
        file.on('error', reject);
      });
    }

    this.logger.log(`File uploaded: ${filePath}`);

    // Return public URL
    return `${this.baseUrl}/${folder}/${filename}`;
  }

  async delete(url: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlObj = new URL(url);
      const relativePath = urlObj.pathname.replace('/uploads/', '');
      const filePath = join(this.uploadDir, relativePath);

      await fs.unlink(filePath);
      this.logger.log(`File deleted: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${url}`, error.stack);
      throw error;
    }
  }

  async getUrl(filename: string, options?: GetUrlOptions): Promise<string> {
    // For local storage, just return the static URL
    return `${this.baseUrl}/${filename}`;
  }
}
