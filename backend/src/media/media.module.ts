import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { AzureBlobStorageProvider } from './providers/azure-blob-storage.provider';
import { IStorageProvider } from './interfaces/storage-provider.interface';

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    LocalStorageProvider,
    S3StorageProvider,
    AzureBlobStorageProvider,
    {
      provide: 'STORAGE_PROVIDER',
      useFactory: (
        configService: ConfigService,
        localProvider: LocalStorageProvider,
        s3Provider: S3StorageProvider,
        azureBlobProvider: AzureBlobStorageProvider,
      ): IStorageProvider => {
        const storageType = configService.get<string>('STORAGE_TYPE', 'local');

        switch (storageType) {
          case 'azure':
            return azureBlobProvider;
          case 's3':
            return s3Provider;
          case 'local':
          default:
            return localProvider;
        }
      },
      inject: [ConfigService, LocalStorageProvider, S3StorageProvider, AzureBlobStorageProvider],
    },
  ],
  exports: [MediaService, 'STORAGE_PROVIDER'],
})
export class MediaModule {}
