

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from './s3.service';
import { FieldType, Media, MediaEntityType } from '@prisma/client';


@Injectable()
export class MediaResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  /* -------------------------------- HELPERS -------------------------------- */

  private async getSignedUrlCached(
    key: string,
    cache: Map<string, string>,
  ): Promise<string> {
    if (!cache.has(key)) {
      cache.set(key, await this.s3Service.getSignedUrl(key));
    }
    return cache.get(key)!;
  }

  /* -------------------------- SINGLE MEDIA (1:1) --------------------------- */

  async resolveSingle(
    entityType: MediaEntityType,
    entityId: string,
    field: FieldType,
  ) {
    const link = await this.prisma.mediaLink.findFirst({
      where: {
        entityType,
        entityId,
        field,
        media: { deletedAt: null },
      },
      include: { media: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!link?.media) return null;

    return {
      mediaId: link.media.id,
      mediaDetail: link.media,
      url: await this.s3Service.getSignedUrl(link.media.key),
    };
  }

  /* ----------------------- MANY ENTITIES → ONE MEDIA ------------------------ */

  async resolveMany(
    entityType: MediaEntityType,
    entityIds: string[],
    field: FieldType,
  ) {
    if (!entityIds.length)
      return new Map<string, { mediaId: string; url: string }>();

    const links = await this.prisma.mediaLink.findMany({
      where: {
        
        entityType,
        field,
        entityId: { in: entityIds },
        media: { deletedAt: null },
      },
      include: { media: true },
    });

    const map = new Map<string, { mediaId: string; url: string }>();
    const urlCache = new Map<string, string>();

    for (const link of links) {
      if (!link.media) continue;

      const url = await this.getSignedUrlCached(link.media.key, urlCache);

      map.set(link.entityId, {
        mediaId: link.media.id,
        url,
      });
    }

    return map;
  }

  /* -------------------- MANY ENTITIES → MANY MEDIA -------------------------- */

  async resolveManyForManyEntities(

    entityType: MediaEntityType,
    entityIds: string[],
    field: FieldType,
  ) {
    if (!entityIds.length)
      return new Map<
        string,
        { mediaId: string; mediaDetail: Media; url: string }[]
      >();

    const links = await this.prisma.mediaLink.findMany({
      where: {
        entityType,
        field,
        entityId: { in: entityIds },
        media: { deletedAt: null },
      },
      include: { media: true },
      orderBy: { createdAt: 'desc' },
    });

    const map = new Map<
      string,
      { mediaId: string; mediaDetail: Media; url: string }[]
    >();

    const urlCache = new Map<string, string>();

    for (const link of links) {
      if (!link.media) continue;

      const url = await this.getSignedUrlCached(link.media.key, urlCache);

      if (!map.has(link.entityId)) {
        map.set(link.entityId, []);
      }

      map.get(link.entityId)!.push({
        mediaId: link.media.id,
        mediaDetail: link.media,
        url,
      });
    }

    return map;
  }

  /* --------------------- SINGLE ENTITY → MANY MEDIA ------------------------- */

  async resolveManyForSingleEntity(
    entityType: MediaEntityType,
    entityId: string,
    field: FieldType,
  ) {
    const links = await this.prisma.mediaLink.findMany({
      where: {
        entityType,
        entityId,
        field,
        media: { deletedAt: null },
      },
      include: { media: true },
      orderBy: { createdAt: 'desc' },
    });

    const urlCache = new Map<string, string>();

    return Promise.all(
      links
        .filter((l) => l.media)
        .map(async (link) => ({
          mediaId: link.media!.id,
          mediaDetail: link.media!,
          url: await this.getSignedUrlCached(link.media!.key, urlCache),
        })),
    );
  }

  /* ---------------------------- STOCK MEDIA -------------------------------- */

  async resolveStockMany(

    mediaIds: string[],
    sourceStockType: MediaEntityType,
  ) {
    if (!mediaIds.length)
      return new Map<string, { mediaId: string; url: string }>();

    const media = await this.prisma.media.findMany({
      where: {
        
        source: 'STOCK',
        sourceStockType,
        deletedAt: null,
        id: { in: mediaIds },
      },
    });

    const map = new Map<string, { mediaId: string; url: string }>();
    const urlCache = new Map<string, string>();

    for (const m of media) {
      if (!urlCache.has(m.key)) {
        urlCache.set(m.key, await this.s3Service.getSignedUrl(m.key));
      }

      map.set(m.id, {
        mediaId: m.id,
        url: urlCache.get(m.key)!,
      });
    }

    return map;
  }
}
