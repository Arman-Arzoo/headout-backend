import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from './s3.service';

import { MediaResolverService } from './mediaResolver.service';
import {
  FieldType,
  MediaEntityType,
  MediaSource,
  MediaType,
} from '@prisma/client';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly mediaResolver: MediaResolverService,
  ) {}

  /**
   * Upload media and store metadata in DB
   * ❌ Does NOT store signed URL
   * ✅ Stores only S3 key
   */

  async uploadMedia(
    userId: string,
    file: Express.Multer.File,
    folder: string,
    type: MediaType,
    source?: MediaSource,
    sourceStockType?: MediaEntityType,
  ) {
    try {
      const uploaded = await this.s3Service.uploadFile(file, folder);

      console.log('uploaded', uploaded);
      console.log('file', file);
      console.log('userId', userId);
      console.log('folder', folder);
      console.log('type', type);

      return await this.prisma.media.create({
        data: {
          userId,
          key: uploaded.key,
          type,
          mimeType: file.mimetype,
          size: file.size,
          originalName: file.originalname,
          source: source || MediaSource.UPLOADED,
          sourceStockType: sourceStockType || null,
        },
      });
    } catch (error) {
      console.error('UPLOAD MEDIA ERROR =>', error);
      throw error;
    }
  }

  /**
   * List all active media for logged-in user
   */
  async listUserMedia(userId: string) {
    return this.prisma.media.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Generate signed URL (READ access)
   * ✅ URL generated on demand
   */
  async getMediaSignedUrl(mediaId: string, userId: string) {
    const media = await this.prisma.media.findFirst({
      where: {
        id: mediaId,
        userId,
        deletedAt: null,
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return this.s3Service.getSignedUrl(media.key);
  }

  /**
   * Soft delete media (DB first, then S3)
   */
  async deleteMedia(userId: string, mediaId: string) {
    const media = await this.prisma.media.findFirst({
      where: {
        id: mediaId,
        userId,
        deletedAt: null,
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // ✅ DB first, then S3 (safe order)
    await this.prisma.$transaction(async (tx) => {
      await tx.media.update({
        where: { id: mediaId },
        data: { deletedAt: new Date() },
      });

      await this.s3Service.deleteFile(media.key);
    });

    return { success: true };
  }

  // -------------------------
  // Attach Media to Entity
  // -------------------------

  async attachMedia(
    userId: string,
    mediaId: string,
    entityType: MediaEntityType,
    field: FieldType,
    entityId: string,
    caption?: string,
  ) {
    try {
      if (!entityType || !entityId) {
        throw new ForbiddenException('Entity type and ID must be provided');
      }

      /* ----------------------------------------
       Validate media ownership
    ----------------------------------------- */
      const media = await this.prisma.media.findFirst({
        where: {
          id: mediaId,
          userId,
          deletedAt: null,
        },
      });

      if (!media) {
        throw new NotFoundException('Media not found or not owned by user');
      }

      /* ----------------------------------------
       SINGLE MEDIA (ICON → replace)
    ----------------------------------------- */
      if (field === FieldType.ICON) {
        return await this.prisma.$transaction(async (tx) => {
          await tx.mediaLink.deleteMany({
            where: {
              entityType,
              entityId,
              field: FieldType.ICON,
            },
          });

          return tx.mediaLink.create({
            data: {
              mediaId,
              entityType,
              entityId,
              field,
              caption,
            },
          });
        });
      }

      /* ----------------------------------------
       MULTIPLE MEDIA (GALLERY / ATTACHMENT → add)
    ----------------------------------------- */
      return await this.prisma.mediaLink.create({
        data: {
          mediaId,
          entityType,
          entityId,
          field,
          caption,
        },
      });
    } catch (error) {
      /* ----------------------------------------
       Logging (important for debugging)
    ----------------------------------------- */
      console.error('ATTACH MEDIA ERROR =>', {
        userId,
        mediaId,
        entityType,
        entityId,
        field,
        error,
      });

      /* ----------------------------------------
       Re-throw known errors
    ----------------------------------------- */
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      /* ----------------------------------------
       Fallback error
    ----------------------------------------- */
      throw new BadRequestException('Failed to attach media');
    }
  }

  // get asset media stock
  async getStockMedia(sourceStockType: MediaEntityType) {
    const stockMedia = await this.prisma.media.findMany({
      where: {
        source: 'STOCK',
        sourceStockType: sourceStockType,
        deletedAt: null,
      },
    });

    const iconMap = await this.mediaResolver.resolveStockMany(
      stockMedia.map((a) => a.id),
      sourceStockType,
    );

    const assetsWithIcons = stockMedia.map((asset) => ({
      ...asset,
      icon: iconMap.get('stock') ?? null,
    }));
    return assetsWithIcons;
  }
}
