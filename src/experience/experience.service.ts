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
  // CREATE EXPERIENCE
  // =====================================================
  // async createExperience(dto: CreateExperienceDto, userId: string) {
  //   const vendor = await this.prisma.vendorProfile.findUnique({
  //     where: { userId },
  //   });

  //   if (!vendor) {
  //     throw new BadRequestException('Vendor profile does not exist');
  //   }

  //   const slug = slugify(dto.title, {
  //     lower: true,
  //     strict: true,
  //     trim: true,
  //   });

  //   return this.prisma.$transaction(async (tx) => {
  //     const experience = await tx.experience.create({
  //       data: {
  //         title: dto.title,
  //         slug,

  //         description: dto.description,
  //         location: dto.location,
  //         city: dto.city,
  //         country: dto.country,
  //         latitude: dto.latitude,
  //         longitude: dto.longitude,
  //         address: dto.address,
  //         price: dto.price,
  //         duration: dto.duration,
  //         cancellationPolicy: dto.cancellationPolicy as string,
  //         available: dto.available ?? true,

  //         category: { connect: { id: dto.categoryId } },

  //         ...(dto.subCategoryId && {
  //           subCategory: { connect: { id: dto.subCategoryId } },
  //         }),
  //         vendor: {
  //           connect: { id: vendor.id },
  //         },
  //       },
  //     });

  //     const expId = experience.id;

  //     // ================= THEMES (explicit join)
  //     if (dto.themeIds?.length) {
  //       await tx.experienceTheme.createMany({
  //         data: dto.themeIds.map((themeId) => ({
  //           themeId,
  //           experienceId: expId,
  //         })),
  //       });
  //     }

  //     // ---------- Highlights ----------
  //     if (dto.highlights?.length) {
  //       await tx.experienceHighlight.createMany({
  //         data: dto.highlights.map((h, i) => ({
  //           ...h,
  //           order: i,
  //           experienceId: expId,
  //         })),
  //       });
  //     }

  //     // ---------- ExperienceBullets ----------

  //     if (dto.experienceBullets?.length) {
  //       await tx.experienceBullets.createMany({
  //         data: dto.experienceBullets.map((bullet) => ({
  //           text: bullet,
  //           experienceId: experience.id,
  //         })),
  //       });
  //     }
  //     // ---------- Features ----------
  //     if (dto.features?.length) {
  //       await tx.experienceFeature.createMany({
  //         data: dto.features.map((f, i) => ({
  //           ...f,
  //           order: i,
  //           experienceId: expId,
  //         })),
  //       });
  //     }

  //     // ---------- Sections ----------
  //     if (dto.sections?.length) {
  //       await tx.experienceSection.createMany({
  //         data: dto.sections.map((s, i) => ({
  //           ...s,
  //           order: i,
  //           experienceId: expId,
  //         })),
  //       });
  //     }

  //     // ---------- Operating ----------
  //     if (dto.operatingHours?.length) {
  //       await tx.experienceOperatingHour.createMany({
  //         data: dto.operatingHours.map((o) => ({ ...o, experienceId: expId })),
  //       });
  //     }
  //     4;

  //     // ---------- Info ----------
  //     if (dto.infos?.length) {
  //       await tx.experienceInfo.createMany({
  //         data: dto.infos.map((info, i) => ({
  //           ...info,
  //           order: i,
  //           experienceId: expId,
  //         })),
  //       });
  //     }

  //     // ---------- Ticket Info ----------
  //     if (dto.ticketInfos?.length) {
  //       await tx.experienceTicketInfo.createMany({
  //         data: dto.ticketInfos.map((t, i) => ({
  //           ...t,
  //           order: i,
  //           experienceId: expId,
  //         })),
  //       });
  //     }

  //     return experience;
  //   });
  // }

  async createExperience(dto: CreateExperienceDto, userId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new BadRequestException('Vendor profile does not exist');
    }

    const slug = slugify(dto.title, {
      lower: true,
      strict: true,
      trim: true,
    });

    return this.prisma.$transaction(async (tx) => {
      // ================= EXPERIENCE
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
          duration: dto.duration,
          cancellationPolicy: dto.cancellationPolicy as string,
          available: dto.available ?? true,

          status: 'DRAFT',

          category: { connect: { id: dto.categoryId } },

          ...(dto.subCategoryId && {
            subCategory: { connect: { id: dto.subCategoryId } },
          }),

          vendor: {
            connect: { id: vendor.id },
          },
        },
      });

      const expId = experience.id;

      // ================= PRICINGS
      if (dto.pricings?.length) {
        for (const pricing of dto.pricings) {
          const createdPricing = await tx.experiencePricing.create({
            data: {
              experienceId: expId,
              type: pricing.type,
              name: pricing.name,
              currency: pricing.currency ?? 'USD',

              basePrice: pricing.basePrice,

              minParticipants: pricing.minParticipants,
              maxParticipants: pricing.maxParticipants,
              maxPeople: pricing.maxPeople,

              validFrom: pricing.validFrom,
              validTo: pricing.validTo,
            },
          });

          if (pricing.slots?.length) {
            await tx.pricingSlot.createMany({
              data: pricing.slots.map((slot) => ({
                pricingId: createdPricing.id,
                date: slot.date,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                price: slot.price,
                capacity: slot.capacity,
              })),
            });
          }
        }
      }

      // ================= THEMES
      if (dto.themeIds?.length) {
        await tx.experienceTheme.createMany({
          data: dto.themeIds.map((themeId) => ({
            themeId,
            experienceId: expId,
          })),
        });
      }

      // ---------- Highlights ----------
      if (dto.highlights?.length) {
        await tx.experienceHighlight.createMany({
          data: dto.highlights.map((h, i) => ({
            ...h,
            order: i,
            experienceId: expId,
          })),
        });
      }

      // ---------- Bullets ----------
      if (dto.experienceBullets?.length) {
        await tx.experienceBullets.createMany({
          data: dto.experienceBullets.map((text) => ({
            text,
            experienceId: expId,
          })),
        });
      }

      // ---------- Features ----------
      if (dto.features?.length) {
        await tx.experienceFeature.createMany({
          data: dto.features.map((f, i) => ({
            ...f,
            order: i,
            experienceId: expId,
          })),
        });
      }

      // ---------- Sections ----------
      if (dto.sections?.length) {
        await tx.experienceSection.createMany({
          data: dto.sections.map((s, i) => ({
            ...s,
            order: i,
            experienceId: expId,
          })),
        });
      }

      // ---------- Operating ----------
      if (dto.operatingHours?.length) {
        await tx.experienceOperatingHour.createMany({
          data: dto.operatingHours.map((o) => ({
            ...o,
            experienceId: expId,
          })),
        });
      }

      // ---------- Info ----------
      if (dto.infos?.length) {
        await tx.experienceInfo.createMany({
          data: dto.infos.map((info, i) => ({
            ...info,
            order: i,
            experienceId: expId,
          })),
        });
      }

      // ---------- Ticket Info ----------
      if (dto.ticketInfos?.length) {
        await tx.experienceTicketInfo.createMany({
          data: dto.ticketInfos.map((t, i) => ({
            ...t,
            order: i,
            experienceId: expId,
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
        pricings: {
          where: { active: true },
          include: {
            slots: true,
          },
        },

        // ✅ category + subcategory
        subCategory: {
          include: { category: true },
        },

        // ✅ themes
        themes: {
          include: { theme: true },
        },

        reviews: { select: { id: true } },
      },
    });

    const ids = experiences.map((e) => e.id);

    const galleryMap = await this.mediaResolver.resolveManyForManyEntities(
      MediaEntityType.EXPERIENCE,
      ids,
      FieldType.GALLERY,
    );

    return experiences.map((exp) => ({
      ...exp,
      gallery: galleryMap.get(exp.id) ?? [],
    }));
  }

  // =====================================================
  // GET SINGLE EXPERIENCE
  // =====================================================
  async getExperienceBySlug(slug: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { slug },
      include: {
        vendor: true,
        pricings: {
          where: { active: true },
          include: {
            slots: true,
          },
        },
        subCategory: {
          include: { category: true },
        },
        themes: {
          include: { theme: true },
        },
        experienceHighlights: { orderBy: { order: 'asc' } },
        experienceFeatures: { orderBy: { order: 'asc' } },
        experienceSections: { orderBy: { order: 'asc' } },
        experienceOperatingHours: true,
        experienceInfos: { orderBy: { order: 'asc' } },
        experienceTicketInfos: { orderBy: { order: 'asc' } },
        experienceBullets: true,
      },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

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
  // UPDATE EXPERIENCE
  // =====================================================
  async updateExperience(id: string, dto: Partial<CreateExperienceDto>) {
    const exists = await this.prisma.experience.findUnique({
      where: { id },
    });

    if (!exists) throw new NotFoundException('Experience not found');

    const slug = dto.title
      ? slugify(dto.title, { lower: true, strict: true })
      : undefined;

    return this.prisma.$transaction(
      async (tx) => {
        // ================= Scalars
        const data: any = {
          ...(dto.title && { title: dto.title }),
          ...(dto.description && { description: dto.description }),
          ...(dto.location && { location: dto.location }),
          ...(dto.city && { city: dto.city }),
          ...(dto.country && { country: dto.country }),
          // ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.duration !== undefined && { duration: dto.duration }),
          ...(dto.available !== undefined && { available: dto.available }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.cancellationPolicy && {
            cancellationPolicy: dto.cancellationPolicy,
          }),
          ...(slug && { slug }),
        };

        if (dto.categoryId) {
          data.category = { connect: { id: dto.categoryId } };
        }

        if (dto.subCategoryId) {
          data.subCategory = { connect: { id: dto.subCategoryId } };
        }

        const updated = await tx.experience.update({
          where: { id },
          data,
        });

        // ======================================================
        // 🔥 FAST DELETE (parallel to avoid timeout)
        // ======================================================

        await Promise.all([
          tx.experienceTheme.deleteMany({ where: { experienceId: id } }),
          tx.experienceHighlight.deleteMany({ where: { experienceId: id } }),
          tx.experienceBullets.deleteMany({ where: { experienceId: id } }),
          tx.experienceFeature.deleteMany({ where: { experienceId: id } }),
          tx.experienceSection.deleteMany({ where: { experienceId: id } }),
          tx.experienceOperatingHour.deleteMany({
            where: { experienceId: id },
          }),
          tx.experienceInfo.deleteMany({ where: { experienceId: id } }),
          tx.experienceTicketInfo.deleteMany({ where: { experienceId: id } }),
        ]);

        // ======================================================
        // 🔥 CREATE (only if data provided)
        // ======================================================

        if (dto.themeIds?.length) {
          await tx.experienceTheme.createMany({
            data: dto.themeIds.map((themeId) => ({
              themeId,
              experienceId: id,
            })),
          });
        }

        if (dto.highlights?.length) {
          await tx.experienceHighlight.createMany({
            data: dto.highlights.map((h, i) => ({
              ...h,
              order: i,
              experienceId: id,
            })),
          });
        }

        if (dto.experienceBullets?.length) {
          await tx.experienceBullets.createMany({
            data: dto.experienceBullets.map((text) => ({
              text,
              experienceId: id,
            })),
          });
        }

        if (dto.features?.length) {
          await tx.experienceFeature.createMany({
            data: dto.features.map((f, i) => ({
              ...f,
              order: i,
              experienceId: id,
            })),
          });
        }

        if (dto.sections?.length) {
          await tx.experienceSection.createMany({
            data: dto.sections.map((s, i) => ({
              ...s,
              order: i,
              experienceId: id,
            })),
          });
        }

        if (dto.operatingHours?.length) {
          await tx.experienceOperatingHour.createMany({
            data: dto.operatingHours.map((o) => ({
              ...o,
              experienceId: id,
            })),
          });
        }

        if (dto.infos?.length) {
          await tx.experienceInfo.createMany({
            data: dto.infos.map((info, i) => ({
              ...info,
              order: i,
              experienceId: id,
            })),
          });
        }

        if (dto.ticketInfos?.length) {
          await tx.experienceTicketInfo.createMany({
            data: dto.ticketInfos.map((t, i) => ({
              ...t,
              order: i,
              experienceId: id,
            })),
          });
        }

        if (dto.pricings?.length) {
          await tx.experiencePricing.deleteMany({
            where: { experienceId: id },
          });

          for (const pricing of dto.pricings) {
            const createdPricing = await tx.experiencePricing.create({
              data: {
                experienceId: id,
                type: pricing.type,
                name: pricing.name,
                currency: pricing.currency ?? 'USD',
                basePrice: pricing.basePrice,
                minParticipants: pricing.minParticipants,
                maxParticipants: pricing.maxParticipants,
                maxPeople: pricing.maxPeople,
                validFrom: pricing.validFrom,
                validTo: pricing.validTo,
              },
            });

            if (pricing.slots?.length) {
              await tx.pricingSlot.createMany({
                data: pricing.slots.map((slot) => ({
                  pricingId: createdPricing.id,
                  date: slot.date,
                  dayOfWeek: slot.dayOfWeek,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  price: slot.price,
                  capacity: slot.capacity,
                })),
              });
            }
          }
        }

        return updated;
      },
      {
        timeout: 20000,
      },
    );
  }

  // =====================================================
  // DELETE
  // =====================================================
  async deleteExperience(id: string) {
    return this.prisma.experience.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
      },
    });
  }

  // =====================================================
  // PUBLISH
  // =====================================================
  async publishExperience(id: string) {
    return this.prisma.experience.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
      },
    });
  }
}
