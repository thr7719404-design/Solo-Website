import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { MediaService } from './media.service';
import { UploadResponseDto } from './dto/upload-response.dto';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
    @Body('optimize') optimize?: string,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const shouldOptimize = optimize !== 'false'; // Default true

    return this.mediaService.uploadFile(
      file,
      folder || 'general',
      shouldOptimize,
    );
  }

  @Post('upload-multiple')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @HttpCode(HttpStatus.CREATED)
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
    @Body('optimize') optimize?: string,
  ): Promise<UploadResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const shouldOptimize = optimize !== 'false';

    return this.mediaService.uploadFiles(
      files,
      folder || 'general',
      shouldOptimize,
    );
  }

  @Delete('delete')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteFile(@Body('url') url: string): Promise<{ message: string }> {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    await this.mediaService.deleteFile(url);
    return { message: 'File deleted successfully' };
  }
}
