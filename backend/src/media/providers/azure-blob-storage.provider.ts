import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import {
  IStorageProvider,
  UploadOptions,
  GetUrlOptions,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class AzureBlobStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(AzureBlobStorageProvider.name);
  private containerClient: ContainerClient;
  private readonly containerName: string;
  private readonly accountUrl: string;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    this.containerName = this.configService.get<string>(
      'AZURE_STORAGE_CONTAINER',
      'media',
    );

    if (!connectionString) {
      this.logger.warn(
        'AZURE_STORAGE_CONNECTION_STRING not set — Azure Blob provider will fail at runtime',
      );
      return;
    }

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient =
      blobServiceClient.getContainerClient(this.containerName);
    this.accountUrl = blobServiceClient.url;

    this.logger.log(
      `Azure Blob storage initialized: container=${this.containerName}`,
    );
  }

  async upload(
    file: Buffer | NodeJS.ReadableStream,
    filename: string,
    options?: UploadOptions,
  ): Promise<string> {
    const folder = options?.folder || 'general';
    const blobName = `${folder}/${filename}`;

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const body = Buffer.isBuffer(file) ? file : await this.streamToBuffer(file);

    await blockBlobClient.uploadData(body, {
      blobHTTPHeaders: {
        blobContentType: options?.mimetype || 'application/octet-stream',
        blobCacheControl: 'public, max-age=31536000, immutable',
      },
    });

    const url = blockBlobClient.url;
    this.logger.log(`Azure Blob upload: ${blobName} (${body.length} bytes)`);

    return url;
  }

  async delete(url: string): Promise<void> {
    const blobName = this.extractBlobName(url);
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.deleteIfExists();
    this.logger.log(`Azure Blob delete: ${blobName}`);
  }

  async getUrl(filename: string, _options?: GetUrlOptions): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
    return blockBlobClient.url;
  }

  private extractBlobName(url: string): string {
    try {
      const u = new URL(url);
      // Path is like /media/products/uuid.jpg — strip leading /containerName/
      const path = u.pathname;
      const prefix = `/${this.containerName}/`;
      if (path.startsWith(prefix)) {
        return path.substring(prefix.length);
      }
      return path.replace(/^\//, '');
    } catch {
      return url;
    }
  }

  private async streamToBuffer(
    stream: NodeJS.ReadableStream,
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
