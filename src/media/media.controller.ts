import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { MediaService } from './media.service';
import { FieldType, MediaEntityType, MediaSource } from '@prisma/client';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // -------------------------
  // Upload Image
  // -------------------------
  @Post('upload/image/:folder')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('folder') folder: string,
    @Req() req: any,
    @Query('source') source?: MediaSource,
    @Query('sourceStockType') sourceStockType?: MediaEntityType,
  ) {
    const { id: userId } = req.user;

    if (!file) {
      throw new BadRequestException(
        'File not received. Ensure multipart/form-data with field name "file".',
      );
    }

    return this.mediaService.uploadMedia(
      userId,
      file,
      folder,
      'IMAGE',
      source,
      sourceStockType,
    );
  }

  // -------------------------
  // Upload File
  // -------------------------
  @Post('upload/file/:folder')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('folder') folder: string,
    @Req() req: any,
    @Query('source') source?: MediaSource,
    @Query('sourceStockType') sourceStockType?: MediaEntityType,
  ) {
    const { id: userId } = req.user;

    if (!file) {
      throw new BadRequestException(
        'File not received. Ensure multipart/form-data with field name "file".',
      );
    }

    return this.mediaService.uploadMedia(
      userId,
      file,
      folder,
      'DOCUMENT',
      source,
      sourceStockType,
    );
  }

  // -------------------------
  // List My Media
  // -------------------------
  @Get('my')
  listUserMedia(@Req() req: any) {
    const { id: userId } = req.user;

    return this.mediaService.listUserMedia(userId);
  }

  // -------------------------
  // Get Signed URL (READ)
  // -------------------------
  @Get(':id/url')
  getMediaUrl(
    @Param('id') mediaId: string,
    @Req() req: any,

  ) {
    const { id: userId } = req.user;

    return this.mediaService.getMediaSignedUrl(mediaId, userId);
  }

  // -------------------------
  // Delete Media (Soft delete + S3)
  // -------------------------
  @Delete(':id')
  deleteMedia(
    @Param('id') mediaId: string,
    @Req() req: any,
  ) {
    const { id: userId } = req.user;

    return this.mediaService.deleteMedia(userId, mediaId);
  }

  @Post('attach')
  attachMedia(
    @Req() req: any,
    @Body()
    body: {
      mediaId: string;
      entityType: MediaEntityType;
      entityId: string;
      field: FieldType;
      caption?: string;
    },
  ) {
    const { id: userId } = req.user;
    const { mediaId, entityType, entityId, field, caption } = body;
    console.log('Attach Media Body:', body);
    return this.mediaService.attachMedia(
      userId,
      mediaId,
      entityType,
      field,
      entityId,
      caption,
    );
  }

  // -------------------------
  // Stock  Listing
  // -------------------------
  @Get('stock/:type')
  listStock(
    @Param('type') type: MediaEntityType,
  ) {
    return this.mediaService.getStockMedia(type);
  }
}
