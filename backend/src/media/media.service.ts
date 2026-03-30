import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { IStorageProvider } from './interfaces/storage-provider.interface';
import { UploadResponseDto } from './dto/upload-response.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  private readonly maxFileSize: number; // bytes

  constructor(
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: IStorageProvider,
    private readonly configService: ConfigService,
  ) {
    // Default 5MB max file size
    this.maxFileSize =
      this.configService.get<number>('MAX_FILE_SIZE') || 5 * 1024 * 1024;
  }

  /**
   * Upload a file with validation and optional optimization
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
    optimize: boolean = true,
  ): Promise<UploadResponseDto> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const ext = extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;

    let fileBuffer = file.buffer;

    // Optional: Optimize image
    if (optimize && this.isImage(file.mimetype)) {
      fileBuffer = await this.optimizeImage(fileBuffer, file.mimetype);
      this.logger.log(`Image optimized: ${filename}`);
    }

    // Upload to storage
    const url = await this.storageProvider.upload(fileBuffer, filename, {
      mimetype: file.mimetype,
      folder,
      isPublic: true,
    });

    return {
      url,
      originalName: file.originalname,
      filename,
      size: fileBuffer.length,
      mimetype: file.mimetype,
      uploadedAt: new Date(),
    };
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'general',
    optimize: boolean = true,
  ): Promise<UploadResponseDto[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, folder, optimize),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file by URL
   */
  async deleteFile(url: string): Promise<void> {
    await this.storageProvider.delete(url);
    this.logger.log(`File deleted: ${url}`);
  }

  /**
   * Validate file type and size
   */
  private validateFile(file: Express.Multer.File): void {
    // Check mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      const maxSizeMB = (this.maxFileSize / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File size exceeds ${maxSizeMB}MB limit. Uploaded: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      );
    }
  }

  /**
   * Check if mime type is an image
   */
  private isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  /**
   * Optimize image using sharp
   * - Resize if too large
   * - Compress with quality settings
   * - Convert to optimal format
   */
  private async optimizeImage(
    buffer: Buffer,
    mimetype: string,
  ): Promise<Buffer> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Resize if width > 2000px
      if (metadata.width && metadata.width > 2000) {
        image.resize(2000, null, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Optimize based on format
      if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
        image.jpeg({ quality: 85, progressive: true });
      } else if (mimetype === 'image/png') {
        image.png({ quality: 85, compressionLevel: 9 });
      } else if (mimetype === 'image/webp') {
        image.webp({ quality: 85 });
      }

      return image.toBuffer();
    } catch (error) {
      this.logger.error('Image optimization failed', error.stack);
      // Return original buffer if optimization fails
      return buffer;
    }
  }
}
