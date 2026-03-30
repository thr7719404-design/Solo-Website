import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IStorageProvider,
  UploadOptions,
  GetUrlOptions,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl?: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');

    this.bucket = this.configService.get<string>('AWS_S3_BUCKET', 'solo-ecommerce');
    this.cdnUrl = this.configService.get<string>('AWS_S3_CDN_URL');

    const clientConfig: any = { region };
    if (endpoint) {
      // S3-compatible services (MinIO, DigitalOcean Spaces)
      clientConfig.endpoint = endpoint;
      clientConfig.forcePathStyle = true;
    }

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = { accessKeyId, secretAccessKey };
    }

    this.s3 = new S3Client(clientConfig);
    this.logger.log(`S3 storage initialized: bucket=${this.bucket}, region=${region}`);
  }

  async upload(
    file: Buffer | NodeJS.ReadableStream,
    filename: string,
    options?: UploadOptions,
  ): Promise<string> {
    const folder = options?.folder || 'general';
    const key = `${folder}/${filename}`;

    const body = Buffer.isBuffer(file) ? file : await this.streamToBuffer(file);

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options?.mimetype || 'application/octet-stream',
      }),
    );

    this.logger.log(`S3 upload: ${key} (${body.length} bytes)`);

    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async delete(url: string): Promise<void> {
    const key = this.extractKeyFromUrl(url);
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.log(`S3 delete: ${key}`);
  }

  async getUrl(filename: string, options?: GetUrlOptions): Promise<string> {
    const expiresIn = options?.expiresIn || 3600;
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filename,
      ...(options?.download
        ? { ResponseContentDisposition: 'attachment' }
        : {}),
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  private extractKeyFromUrl(url: string): string {
    try {
      const u = new URL(url);
      // Remove leading slash
      return u.pathname.replace(/^\//, '');
    } catch {
      return url;
    }
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
