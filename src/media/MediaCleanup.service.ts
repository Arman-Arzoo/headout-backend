import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from './s3.service';
import { MediaEntityType, MediaSource } from '@prisma/client';

@Injectable()
export class MediaCleanupService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async deleteEntityMedia(
    entityType: MediaEntityType,
    entityIds: string[],
  ) {
    if (!entityIds?.length) return;

    /**
     * 1️⃣ Fetch ONLY non-stock media linked to the entities
     */
    const mediaLinks = await this.prisma.mediaLink.findMany({
      where: {
        entityType,
        entityId: { in: entityIds },
        media: {
          source: { not: MediaSource.STOCK },
        },
      },
      include: { media: true },
    });

    if (!mediaLinks.length) return;

    /**
     * 2️⃣ Extract media IDs & S3 keys (extra runtime safety)
     */
    const mediaIds = mediaLinks.map((m) => m.mediaId);

    const uploadedKeys = mediaLinks
      .filter((m) => m.media.source === MediaSource.UPLOADED)
      .map((m) => m.media.key);

    /**
     * 3️⃣ DB transaction (links → media)
     */
    await this.prisma.$transaction(async (tx) => {
      await tx.mediaLink.deleteMany({
        where: {
          entityType,
          entityId: { in: entityIds },
          media: {
            source: { not: MediaSource.STOCK },
          },
        },
      });

      await tx.media.deleteMany({
        where: {
          id: { in: mediaIds },
          source: { not: MediaSource.STOCK },
        },
      });
    });

    /**
     * 4️⃣ S3 cleanup (ONLY uploaded files, outside transaction)
     */
    await Promise.allSettled(
      uploadedKeys.map((key) => this.s3Service.deleteFile(key)),
    );
  }
}
