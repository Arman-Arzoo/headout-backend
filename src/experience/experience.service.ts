import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExperienceDto } from './experience.dto';
import slugify from 'slugify';
import { FieldType, MediaEntityType } from '@prisma/client';
import { MediaResolverService } from 'src/media/mediaResolver.service';

@Injectable()
export class ExperienceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaResolver: MediaResolverService,
  ) {}

  // =====================================================
  // CREATE EXPERIENCE (FULL DETAIL PAGE SUPPORT)
  // =====================================================
  async createExperience(dto: CreateExperienceDto, userId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new BadRequestException(
        'Vendor profile does not exist for this user',
      );
    }

    const slug = slugify(dto.title, {
      lower: true,
      strict: true,
      trim: true,
    });

    return this.prisma.$transaction(async (tx) => {
      const experience = await tx.experience.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description,
          location: dto.location,
          city: dto.city,
          country: dto.country,
          latitude: dto.latitude,
          longitude: dto.longitude,
          address: dto.address,
          category: dto.category,
          price: dto.price,
          duration: dto.duration,
          cancellationPolicy: dto.cancellationPolicy as string,
          available: dto.available ?? true,
          vendorId: vendor.id,
        },
      });

      const id = experience.id;

      // ---------- Highlights ----------
      if (dto.highlights?.length) {
        await tx.experienceHighlight.createMany({
          data: dto.highlights.map((h, i) => ({
            ...h,
            order: i,
            experienceId: id,
          })),
        });
      }
      // ---------- ExperienceBullets ----------
      if (dto.experienceBullets?.length) {
        await tx.experienceBullets.createMany({
          data: dto.experienceBullets.map((bullet) => ({
            text: bullet,
            experienceId: experience.id,
          })),
        });
      }

      // ---------- Features ----------
      if (dto.features?.length) {
        await tx.experienceFeature.createMany({
          data: dto.features.map((f, i) => ({
            ...f,
            order: i,
            experienceId: id,
          })),
        });
      }

      // ---------- Sections ----------
      if (dto.sections?.length) {
        await tx.experienceSection.createMany({
          data: dto.sections.map((s, i) => ({
            ...s,
            order: i,
            experienceId: id,
          })),
        });
      }

      // ---------- Operating ----------
      if (dto.operatingHours?.length) {
        await tx.experienceOperatingHour.createMany({
          data: dto.operatingHours.map((o) => ({
            ...o,
            experienceId: id,
          })),
        });
      }

      // ---------- Info ----------
      if (dto.infos?.length) {
        await tx.experienceInfo.createMany({
          data: dto.infos.map((info, i) => ({
            ...info,
            order: i,
            experienceId: id,
          })),
        });
      }

      // ---------- Ticket Info ----------
      if (dto.ticketInfos?.length) {
        await tx.experienceTicketInfo.createMany({
          data: dto.ticketInfos.map((t, i) => ({
            ...t,
            order: i,
            experienceId: id,
          })),
        });
      }

      return experience;
    });
  }

  // =====================================================
  // GET ALL EXPERIENCES
  // =====================================================
  async getAllExperiences() {
    const experiences = await this.prisma.experience.findMany({
      include: {
        vendor: true,
        reviews: {
          select: { id: true },
        },
      },
    });

    const ids = experiences.map((e) => e.id);

    // ⭐ fetch all gallery media in ONE query (fast)
    const galleryMap = await this.mediaResolver.resolveManyForManyEntities(
      MediaEntityType.EXPERIENCE,
      ids,
      FieldType.GALLERY,
    );

    // ⭐ attach media to each experience
    return experiences.map((exp) => ({
      ...exp,
      gallery: galleryMap.get(exp.id) ?? [],
    }));
  }

  // =====================================================
  // GET FULL EXPERIENCE DETAIL (for detail page)
  // =====================================================
  async getExperienceBySlug(slug: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { slug },
      include: {
        vendor: true,
        experienceHighlights: { orderBy: { order: 'asc' } },
        experienceFeatures: { orderBy: { order: 'asc' } },
        experienceSections: { orderBy: { order: 'asc' } },
        experienceOperatingHours: true,
        experienceInfos: { orderBy: { order: 'asc' } },
        experienceTicketInfos: { orderBy: { order: 'asc' } },
        experienceBullets: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 2,
          include: { user: true },
        },
      },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    /* ------------------------------------------
     Resolve media
  ------------------------------------------- */

    const [icon, gallery, attachments] = await Promise.all([
      this.mediaResolver.resolveSingle(
        MediaEntityType.EXPERIENCE,
        experience.id,
        FieldType.ICON,
      ),

      this.mediaResolver.resolveManyForSingleEntity(
        MediaEntityType.EXPERIENCE,
        experience.id,
        FieldType.GALLERY,
      ),

      this.mediaResolver.resolveManyForSingleEntity(
        MediaEntityType.EXPERIENCE,
        experience.id,
        FieldType.ATTACHMENT,
      ),
    ]);

    return {
      ...experience,
      icon,
      gallery,
      attachments,
    };
  }

  // =====================================================
  // UPDATE EXPERIENCE (replace children)
  // =====================================================
  async updateExperience(id: string, dto: Partial<CreateExperienceDto>) {
    const slug = dto.title
      ? slugify(dto.title, { lower: true, strict: true })
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      const {
        highlights,
        features,
        sections,
        operatingHours,
        infos,
        ticketInfos,
        experienceBullets,
        ...scalarData
      } = dto;

      const updated = await tx.experience.update({
        where: { id },
        data: {
          ...scalarData,
          ...(slug && { slug }),
        },
      });

      // delete relations
      await Promise.all([
        tx.experienceHighlight.deleteMany({ where: { experienceId: id } }),
        tx.experienceFeature.deleteMany({ where: { experienceId: id } }),
        tx.experienceSection.deleteMany({ where: { experienceId: id } }),
        tx.experienceOperatingHour.deleteMany({ where: { experienceId: id } }),
        tx.experienceInfo.deleteMany({ where: { experienceId: id } }),
        tx.experienceTicketInfo.deleteMany({ where: { experienceId: id } }),
        tx.experienceBullets.deleteMany({ where: { experienceId: id } }),
      ]);

      // recreate relations
      await this.createExperience(
        { ...updated, ...dto } as any,
        updated.vendorId as string,
      );

      return updated;
    });
  }

  // =====================================================
  // DELETE EXPERIENCE
  // =====================================================
  async deleteExperience(id: string) {
    return this.prisma.experience.delete({
      where: { id },
    });
  }
}
