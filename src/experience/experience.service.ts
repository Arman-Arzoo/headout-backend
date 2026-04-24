// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateExperienceDto } from './experience.dto';
// import slugify from 'slugify';
// import { FieldType, MediaEntityType } from '@prisma/client';
// import { MediaResolverService } from 'src/media/mediaResolver.service';

// @Injectable()
// export class ExperienceService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly mediaResolver: MediaResolverService,
//   ) {}

//   async createExperience(dto: CreateExperienceDto, userId: string) {
//     const vendor = await this.prisma.vendorProfile.findUnique({
//       where: { userId },
//     });

//     if (!vendor) {
//       throw new BadRequestException('Vendor profile does not exist');
//     }

//     const slug = slugify(dto.title, {
//       lower: true,
//       strict: true,
//       trim: true,
//     });

//     return this.prisma.$transaction(async (tx) => {
//       // ================= EXPERIENCE
//       const experience = await tx.experience.create({
//         data: {
//           title: dto.title,
//           slug,

//           description: dto.description,
//           location: dto.location,
//           city: dto.city,
//           country: dto.country,
//           latitude: dto.latitude,
//           longitude: dto.longitude,
//           address: dto.address,
//           duration: dto.duration,
//           cancellationPolicy: dto.cancellationPolicy as string,
//           available: dto.available ?? true,

//           status: 'DRAFT',

//           category: { connect: { id: dto.categoryId } },

//           ...(dto.subCategoryId && {
//             subCategory: { connect: { id: dto.subCategoryId } },
//           }),

//           vendor: {
//             connect: { id: vendor.id },
//           },
//         },
//       });

//       const expId = experience.id;

//       // ================= PRICINGS
//       if (dto.pricings?.length) {
//         for (const pricing of dto.pricings) {
//           const createdPricing = await tx.experiencePricing.create({
//             data: {
//               experienceId: expId,
//               type: pricing?.type,
//               name: pricing?.name || 'default',
//               currency: pricing?.currency ?? 'USD',

//               basePrice: pricing?.basePrice ?? 0,

//               minParticipants: pricing?.minParticipants ?? 0,
//               maxParticipants: pricing?.maxParticipants ?? 0,
//               maxPeople: pricing?.maxPeople ?? 0,

//               validFrom: pricing?.validFrom,
//               validTo: pricing?.validTo,
//             },
//           });

//           if (pricing.slots?.length) {
//             await tx.pricingSlot.createMany({
//               data: pricing.slots.map((slot) => ({
//                 pricingId: createdPricing.id,
//                 date: slot.date,
//                 dayOfWeek: slot.dayOfWeek,
//                 startTime: slot.startTime,
//                 endTime: slot.endTime,
//                 price: slot.price,
//                 capacity: slot.capacity,
//               })),
//             });
//           }
//         }
//       }

//       // ================= THEMES
//       if (dto.themeIds?.length) {
//         await tx.experienceTheme.createMany({
//           data: dto.themeIds.map((themeId) => ({
//             themeId,
//             experienceId: expId,
//           })),
//         });
//       }

//       // ---------- Highlights ----------
//       if (dto.highlights?.length) {
//         await tx.experienceHighlight.createMany({
//           data: dto.highlights.map((h, i) => ({
//             ...h,
//             order: i,
//             experienceId: expId,
//           })),
//         });
//       }

//       // ---------- Bullets ----------
//       if (dto.experienceBullets?.length) {
//         await tx.experienceBullets.createMany({
//           data: dto.experienceBullets.map((text) => ({
//             text,
//             experienceId: expId,
//           })),
//         });
//       }

//       // ---------- Features ----------
//       if (dto.features?.length) {
//         await tx.experienceFeature.createMany({
//           data: dto.features.map((f, i) => ({
//             ...f,
//             order: i,
//             experienceId: expId,
//           })),
//         });
//       }

//       // ---------- Sections ----------
//       if (dto.sections?.length) {
//         await tx.experienceSection.createMany({
//           data: dto.sections.map((s, i) => ({
//             ...s,
//             order: i,
//             experienceId: expId,
//           })),
//         });
//       }

//       // ---------- Operating ----------
//       if (dto.operatingHours?.length) {
//         await tx.experienceOperatingHour.createMany({
//           data: dto.operatingHours.map((o) => ({
//             ...o,
//             experienceId: expId,
//           })),
//         });
//       }

//       // ---------- Info ----------
//       if (dto.infos?.length) {
//         await tx.experienceInfo.createMany({
//           data: dto.infos.map((info, i) => ({
//             ...info,
//             order: i,
//             experienceId: expId,
//           })),
//         });
//       }

//       // ---------- Ticket Info ----------
//       if (dto.ticketInfos?.length) {
//         await tx.experienceTicketInfo.createMany({
//           data: dto.ticketInfos.map((t, i) => ({
//             ...t,
//             order: i,
//             experienceId: expId,
//           })),
//         });
//       }

//       return experience;
//     });
//   }

//   // =====================================================
//   // GET ALL EXPERIENCES
//   // =====================================================
//   async getAllExperiences() {
//     const experiences = await this.prisma.experience.findMany({
//       where: { deletedAt: null },
//       include: {
//         vendor: true,
//         pricings: {
//           where: { active: true },
//           include: {
//             slots: true,
//           },
//         },

//         // ✅ category + subcategory
//         subCategory: {
//           include: { category: true },
//         },

//         // ✅ themes
//         themes: {
//           include: { theme: true },
//         },

//         reviews: { select: { id: true } },
//       },
//     });

//     const ids = experiences.map((e) => e.id);

//     const galleryMap = await this.mediaResolver.resolveManyForManyEntities(
//       MediaEntityType.EXPERIENCE,
//       ids,
//       FieldType.GALLERY,
//     );

//     return experiences.map((exp) => ({
//       ...exp,
//       gallery: galleryMap.get(exp.id) ?? [],
//     }));
//   }

//   // =====================================================
//   // GET SINGLE EXPERIENCE
//   // =====================================================
//   async getExperienceBySlug(slug: string) {
//     const experience = await this.prisma.experience.findFirst({
//       where: { slug, deletedAt: null },
//       include: {
//         vendor: true,

//         pricings: {
//           where: { active: true },
//           include: {
//             slots: true,
//           },
//         },
//         subCategory: {
//           include: { category: true },
//         },
//         themes: {
//           include: { theme: true },
//         },
//         experienceHighlights: { orderBy: { order: 'asc' } },
//         experienceFeatures: { orderBy: { order: 'asc' } },
//         experienceSections: { orderBy: { order: 'asc' } },
//         experienceOperatingHours: true,
//         experienceInfos: { orderBy: { order: 'asc' } },
//         experienceTicketInfos: { orderBy: { order: 'asc' } },
//         experienceBullets: true,
//       },
//     });

//     if (!experience) {
//       throw new NotFoundException('Experience not found');
//     }

//     const [icon, gallery, attachments] = await Promise.all([
//       this.mediaResolver.resolveSingle(
//         MediaEntityType.EXPERIENCE,
//         experience.id,
//         FieldType.ICON,
//       ),
//       this.mediaResolver.resolveManyForSingleEntity(
//         MediaEntityType.EXPERIENCE,
//         experience.id,
//         FieldType.GALLERY,
//       ),
//       this.mediaResolver.resolveManyForSingleEntity(
//         MediaEntityType.EXPERIENCE,
//         experience.id,
//         FieldType.ATTACHMENT,
//       ),
//     ]);

//     return {
//       ...experience,
//       icon,
//       gallery,
//       attachments,
//     };
//   }

//   // =====================================================
//   // UPDATE EXPERIENCE
//   // =====================================================
//   async updateExperience(id: string, dto: Partial<CreateExperienceDto>) {
//     const exists = await this.prisma.experience.findUnique({
//       where: { id },
//     });

//     if (!exists) throw new NotFoundException('Experience not found');

//     // ✅ Only generate slug IF title is provided
//     let slug: string | undefined;

//     if (dto.title) {
//       const baseSlug = slugify(dto.title, {
//         lower: true,
//         strict: true,
//       });

//       const existingSlug = await this.prisma.experience.findFirst({
//         where: {
//           slug: baseSlug,
//           NOT: { id }, // ✅ exclude current record
//         },
//       });

//       slug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug;
//     }

//     return this.prisma.$transaction(
//       async (tx) => {
//         // ================= Scalars
//         const data: any = {
//           ...(dto.title && { title: dto.title }),
//           ...(dto.description && { description: dto.description }),
//           ...(dto.location && { location: dto.location }),
//           ...(dto.status && { status: dto.status }),
//           ...(dto.city && { city: dto.city }),
//           ...(dto.country && { country: dto.country }),
//           ...(dto.duration !== undefined && { duration: dto.duration }),
//           ...(dto.available !== undefined && { available: dto.available }),
//           ...(dto.latitude !== undefined && { latitude: dto.latitude }),
//           ...(dto.longitude !== undefined && { longitude: dto.longitude }),
//           ...(dto.address !== undefined && { address: dto.address }),
//           ...(dto.cancellationPolicy && {
//             cancellationPolicy: dto.cancellationPolicy,
//           }),
//           ...(slug && { slug }), // ✅ only if exists
//         };

//         if (dto.categoryId) {
//           data.category = { connect: { id: dto.categoryId } };
//         }

//         if (dto.subCategoryId) {
//           data.subCategory = { connect: { id: dto.subCategoryId } };
//         }

//         const updated = await tx.experience.update({
//           where: { id },
//           data,
//         });

//         // ======================================================
//         // 🔥 DELETE (only if updating those fields)
//         // ======================================================

//         await Promise.all(
//           [
//             dto.themeIds &&
//               tx.experienceTheme.deleteMany({ where: { experienceId: id } }),
//             dto.highlights &&
//               tx.experienceHighlight.deleteMany({
//                 where: { experienceId: id },
//               }),
//             dto.experienceBullets &&
//               tx.experienceBullets.deleteMany({ where: { experienceId: id } }),
//             dto.features &&
//               tx.experienceFeature.deleteMany({ where: { experienceId: id } }),
//             dto.sections &&
//               tx.experienceSection.deleteMany({ where: { experienceId: id } }),
//             dto.operatingHours &&
//               tx.experienceOperatingHour.deleteMany({
//                 where: { experienceId: id },
//               }),
//             dto.infos &&
//               tx.experienceInfo.deleteMany({ where: { experienceId: id } }),
//             dto.ticketInfos &&
//               tx.experienceTicketInfo.deleteMany({
//                 where: { experienceId: id },
//               }),
//           ].filter(Boolean),
//         ); // ✅ avoid undefined queries

//         // ======================================================
//         // 🔥 CREATE
//         // ======================================================

//         if (dto.themeIds?.length) {
//           await tx.experienceTheme.createMany({
//             data: dto.themeIds.map((themeId) => ({
//               themeId,
//               experienceId: id,
//             })),
//           });
//         }

//         if (dto.highlights?.length) {
//           await tx.experienceHighlight.createMany({
//             data: dto.highlights.map((h, i) => ({
//               ...h,
//               order: i,
//               experienceId: id,
//             })),
//           });
//         }

//         if (dto.experienceBullets?.length) {
//           await tx.experienceBullets.createMany({
//             data: dto.experienceBullets.map((text) => ({
//               text,
//               experienceId: id,
//             })),
//           });
//         }

//         if (dto.features?.length) {
//           await tx.experienceFeature.createMany({
//             data: dto.features.map((f, i) => ({
//               ...f,
//               order: i,
//               experienceId: id,
//             })),
//           });
//         }

//         if (dto.sections?.length) {
//           await tx.experienceSection.createMany({
//             data: dto.sections.map((s, i) => ({
//               ...s,
//               order: i,
//               experienceId: id,
//             })),
//           });
//         }

//         if (dto.operatingHours?.length) {
//           await tx.experienceOperatingHour.createMany({
//             data: dto.operatingHours.map((o) => ({
//               ...o,
//               experienceId: id,
//             })),
//           });
//         }

//         if (dto.infos?.length) {
//           await tx.experienceInfo.createMany({
//             data: dto.infos.map((info, i) => ({
//               ...info,
//               order: i,
//               experienceId: id,
//             })),
//           });
//         }

//         if (dto.ticketInfos?.length) {
//           await tx.experienceTicketInfo.createMany({
//             data: dto.ticketInfos.map((t, i) => ({
//               ...t,
//               order: i,
//               experienceId: id,
//             })),
//           });
//         }

//         // ======================================================
//         // 💰 PRICING (SAFE RESET)
//         // ======================================================

//         if (dto.pricings) {
//           await tx.experiencePricing.deleteMany({
//             where: { experienceId: id },
//           });

//           for (const pricing of dto.pricings) {
//             const createdPricing = await tx.experiencePricing.create({
//               data: {
//                 experienceId: id,
//                 type: pricing.type,
//                 name: pricing.name,
//                 currency: pricing.currency ?? 'USD',
//                 basePrice: pricing.basePrice,
//                 minParticipants: pricing.minParticipants,
//                 maxParticipants: pricing.maxParticipants,
//                 maxPeople: pricing.maxPeople,
//                 validFrom: pricing.validFrom,
//                 validTo: pricing.validTo,
//               },
//             });

//             if (pricing.slots?.length) {
//               await tx.pricingSlot.createMany({
//                 data: pricing.slots.map((slot) => ({
//                   pricingId: createdPricing.id,
//                   date: slot.date,
//                   dayOfWeek: slot.dayOfWeek,
//                   startTime: slot.startTime,
//                   endTime: slot.endTime,
//                   price: slot.price,
//                   capacity: slot.capacity,
//                 })),
//               });
//             }
//           }
//         }

//         return updated;
//       },
//       { timeout: 20000 },
//     );
//   }

//   // =====================================================
//   // DELETE
//   // =====================================================
//   async deleteExperience(id: string) {
//     return this.prisma.experience.update({
//       where: { id },
//       data: {
//         deletedAt: new Date(),
//         status: 'ARCHIVED',
//       },
//     });
//   }

//   // =====================================================
//   // PUBLISH
//   // =====================================================
//   async publishExperience(id: string) {
//     return this.prisma.experience.update({
//       where: { id },
//       data: {
//         status: 'PUBLISHED',
//       },
//     });
//   }

//   async checkAvailability(
//     experienceId: string,
//     date: string,
//     participants = 1,
//   ) {
//     const targetDate = new Date(date);

//     const [pricings, overrides, reservations, bookings] = await Promise.all([
//       this.prisma.experiencePricing.findMany({
//         where: {
//           experienceId,
//           active: true,
//         },
//         include: { slots: true },
//       }),

//       this.prisma.experienceAvailability.findMany({
//         where: {
//           experienceId,
//           date: targetDate,
//         },
//       }),

//       this.prisma.reservation.findMany({
//         where: {
//           experienceId,
//           date: targetDate,
//           expiresAt: { gt: new Date() },
//         },
//       }),

//       this.prisma.booking.findMany({
//         where: {
//           experienceId,
//           date: targetDate,
//           status: 'CONFIRMED',
//         },
//       }),
//     ]);

//     const options = pricings.map((pricing) => {
//       const slots = pricing.slots
//         .map((slot) => {
//           let capacity = slot.capacity || pricing.maxPeople || 999;

//           const override = overrides.find(
//             (o) => o.startTime === slot.startTime && o.endTime === slot.endTime,
//           );

//           if (override) {
//             if (override.isBlocked) return null;

//             if (override.bookingCapacitySnapshot) {
//               capacity = override.bookingCapacitySnapshot;
//             }
//           }

//           const reserved = reservations
//             .filter(
//               (r) =>
//                 r.startTime === slot.startTime &&
//                 r.date.getTime() === targetDate.getTime(),
//             )
//             .reduce((sum, r) => sum + r.seats, 0);

//           const booked = bookings
//             .filter((b) => b.startTime === slot.startTime)
//             .reduce((sum, b) => sum + b.participants, 0);

//           const availableSeats = capacity - reserved - booked;

//           return {
//             startTime: slot.startTime,
//             endTime: slot.endTime,
//             price: slot.price ?? pricing.basePrice,
//             availableSeats,
//             isAvailable: availableSeats >= participants,
//           };
//         })
//         .filter(Boolean);

//       const isSoldOut = slots.every((s) => !s?.isAvailable);

//       return {
//         pricing,
//         slots,
//         isSoldOut,
//       };
//     });

//     return { options };
//   }

//   async getAvailableOptions(
//     experienceId: string,
//     date: string,
//     participants = 1,
//   ) {
//     const data = await this.checkAvailability(experienceId, date, participants);

//     return {
//       options: await Promise.all(
//         data.options.map(async (opt) => {
//           if (!opt.isSoldOut) return opt;

//           const nextDate = await this.getNextAvailableDate(
//             experienceId,
//             opt.pricing.id,
//           );

//           return {
//             ...opt,
//             nextAvailableDate: nextDate,
//           };
//         }),
//       ),
//     };
//   }

//   async getNextAvailableDate(experienceId: string, pricingId: string) {
//     const today = new Date();

//     for (let i = 1; i <= 30; i++) {
//       const date = new Date();
//       date.setDate(today.getDate() + i);

//       const availability = await this.checkAvailability(
//         experienceId,
//         date.toISOString(),
//         1,
//       );

//       const pricing = availability.options.find(
//         (p) => p.pricing.id === pricingId,
//       );

//       if (pricing && !pricing.isSoldOut) {
//         return date;
//       }
//     }

//     return null;
//   }
// }

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FieldType, MediaEntityType, Prisma } from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from 'src/prisma/prisma.service';
import { MediaResolverService } from 'src/media/mediaResolver.service';
import { CreateExperienceDto } from './experience.dto';

@Injectable()
export class ExperienceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaResolver: MediaResolverService,
  ) {}

  private async generateUniqueSlug(
    tx: Prisma.TransactionClient,
    title: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await tx.experience.findFirst({
        where: {
          slug,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (!existing) return slug;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async createExperience(dto: CreateExperienceDto, userId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!vendor) {
      throw new BadRequestException('Vendor profile does not exist');
    }

    return this.prisma.$transaction(async (tx) => {
      const slug = await this.generateUniqueSlug(tx, dto.title);

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
          status: dto.status ?? 'DRAFT',
          category: { connect: { id: dto.categoryId } },
          ...(dto.subCategoryId && {
            subCategory: { connect: { id: dto.subCategoryId } },
          }),
          vendor: { connect: { id: vendor.id } },
        },
      });

      const expId = experience.id;

      if (dto.pricings?.length) {
        for (const pricing of dto.pricings) {
          const createdPricing = await tx.experiencePricing.create({
            data: {
              experienceId: expId,
              type: pricing.type,
              name: pricing.name || 'default',
              currency: pricing.currency ?? 'USD',
              exchangeRate: pricing.exchangeRate,
              basePrice: pricing.basePrice ?? 0,
              minParticipants: pricing.minParticipants ?? null,
              maxParticipants: pricing.maxParticipants ?? null,
              maxPeople: pricing.maxPeople ?? null,
              validFrom: pricing.validFrom ?? null,
              validTo: pricing.validTo ?? null,
              categoryPrices: pricing.categoryPrices ?? {},
            },
          });

          if (pricing.slots?.length) {
            await tx.pricingSlot.createMany({
              data: pricing.slots.map((slot) => ({
                pricingId: createdPricing.id,
                date: slot.date ?? null,
                dayOfWeek: slot.dayOfWeek ?? null,
                startTime: slot.startTime ?? null,
                endTime: slot.endTime ?? null,
                price: slot.price,
                capacity: slot.capacity ?? null,
              })),
            });
          }
        }
      }

      if (dto.themeIds?.length) {
        await tx.experienceTheme.createMany({
          data: dto.themeIds.map((themeId) => ({
            themeId,
            experienceId: expId,
          })),
          skipDuplicates: true,
        });
      }

      if (dto.highlights?.length) {
        await tx.experienceHighlight.createMany({
          data: dto.highlights.map((h, i) => ({
            ...h,
            order: i,
            experienceId: expId,
          })),
        });
      }

      if (dto.experienceBullets?.length) {
        await tx.experienceBullets.createMany({
          data: dto.experienceBullets.map((text) => ({
            text,
            experienceId: expId,
          })),
        });
      }

      if (dto.features?.length) {
        await tx.experienceFeature.createMany({
          data: dto.features.map((f, i) => ({
            ...f,
            order: i,
            experienceId: expId,
          })),
        });
      }

      if (dto.sections?.length) {
        await tx.experienceSection.createMany({
          data: dto.sections.map((s, i) => ({
            ...s,
            order: i,
            experienceId: expId,
          })),
        });
      }

      if (dto.operatingHours?.length) {
        await tx.experienceOperatingHour.createMany({
          data: dto.operatingHours.map((o) => ({
            ...o,
            experienceId: expId,
          })),
        });
      }

      if (dto.infos?.length) {
        await tx.experienceInfo.createMany({
          data: dto.infos.map((info, i) => ({
            ...info,
            order: i,
            experienceId: expId,
          })),
        });
      }

      if (dto.ticketInfos?.length) {
        await tx.experienceTicketInfo.createMany({
          data: dto.ticketInfos.map((t, i) => ({
            ...t,
            order: i,
            experienceId: expId,
          })),
        });
      }

      if (dto.ticketTypes?.length) {
        await tx.experienceTicketType.createMany({
          data: dto.ticketTypes.map((ticket, index) => ({
            experienceId: expId,
            pricingId: ticket.pricingId ?? null,
            code: ticket.code,
            label: ticket.label,
            description: ticket.description ?? null,
            minAge: ticket.minAge ?? null,
            maxAge: ticket.maxAge ?? null,
            basePrice: ticket.basePrice,
            active: ticket.active ?? true,
            sortOrder: ticket.sortOrder ?? index,
          })),
          skipDuplicates: true,
        });
      }

      return experience;
    });
  }

  async getAllExperiences() {
    const experiences = await this.prisma.experience.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        vendor: true,
        category: true,
        subCategory: {
          include: { category: true },
        },
        pricings: {
          where: { active: true },
          include: {
            slots: true,
          },
        },
        themes: {
          include: { theme: true },
        },
        reviews: {
          select: { id: true },
        },
        ticketTypes: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
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

  async getExperienceBySlug(slug: string) {
    const experience = await this.prisma.experience.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        vendor: true,
        category: true,
        subCategory: {
          include: { category: true },
        },
        pricings: {
          where: { active: true },
          include: { slots: true },
          orderBy: { createdAt: 'asc' },
        },
        themes: {
          include: { theme: true },
        },
        experienceHighlights: { orderBy: { order: 'asc' } },
        experienceFeatures: { orderBy: { order: 'asc' } },
        experienceSections: { orderBy: { order: 'asc' } },
        experienceOperatingHours: { orderBy: { dayOfWeek: 'asc' } },
        experienceInfos: { orderBy: { order: 'asc' } },
        experienceTicketInfos: { orderBy: { order: 'asc' } },
        experienceBullets: true,
        ticketTypes: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        },
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

  async updateExperience(id: string, dto: Partial<CreateExperienceDto>) {
    const exists = await this.prisma.experience.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Experience not found');
    }

    return this.prisma.$transaction(
      async (tx) => {
        const slug = dto.title
          ? await this.generateUniqueSlug(tx, dto.title, id)
          : undefined;

        const data: Prisma.ExperienceUpdateInput = {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.location !== undefined ? { location: dto.location } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.city !== undefined ? { city: dto.city } : {}),
          ...(dto.country !== undefined ? { country: dto.country } : {}),
          ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
          ...(dto.available !== undefined ? { available: dto.available } : {}),
          ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
          ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
          ...(dto.address !== undefined ? { address: dto.address } : {}),
          ...(dto.cancellationPolicy !== undefined
            ? { cancellationPolicy: dto.cancellationPolicy }
            : {}),

          ...(slug !== undefined ? { slug } : {}),
        };

        if (dto.categoryId) {
          data.category = { connect: { id: dto.categoryId } };
        }

        if (dto.subCategoryId !== undefined) {
          data.subCategory = dto.subCategoryId
            ? { connect: { id: dto.subCategoryId } }
            : { disconnect: true };
        }

        const updated = await tx.experience.update({
          where: { id },
          data,
        });

        const deleteOps = [
          dto.themeIds !== undefined
            ? tx.experienceTheme.deleteMany({ where: { experienceId: id } })
            : null,
          dto.highlights !== undefined
            ? tx.experienceHighlight.deleteMany({
                where: { experienceId: id },
              })
            : null,
          dto.experienceBullets !== undefined
            ? tx.experienceBullets.deleteMany({ where: { experienceId: id } })
            : null,
          dto.features !== undefined
            ? tx.experienceFeature.deleteMany({ where: { experienceId: id } })
            : null,
          dto.sections !== undefined
            ? tx.experienceSection.deleteMany({ where: { experienceId: id } })
            : null,
          dto.operatingHours !== undefined
            ? tx.experienceOperatingHour.deleteMany({
                where: { experienceId: id },
              })
            : null,
          dto.infos !== undefined
            ? tx.experienceInfo.deleteMany({ where: { experienceId: id } })
            : null,
          dto.ticketInfos !== undefined
            ? tx.experienceTicketInfo.deleteMany({
                where: { experienceId: id },
              })
            : null,
          dto.pricings !== undefined
            ? tx.experiencePricing.deleteMany({ where: { experienceId: id } })
            : null,
          dto.ticketTypes !== undefined
            ? tx.experienceTicketType.deleteMany({
                where: { experienceId: id },
              })
            : null,
        ].filter((op): op is NonNullable<typeof op> => op !== null);
        await Promise.all(deleteOps);

        if (dto.themeIds?.length) {
          await tx.experienceTheme.createMany({
            data: dto.themeIds.map((themeId) => ({
              themeId,
              experienceId: id,
            })),
            skipDuplicates: true,
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
          for (const pricing of dto.pricings) {
            const createdPricing = await tx.experiencePricing.create({
              data: {
                experienceId: id,
                type: pricing.type,
                name: pricing.name || 'default',
                currency: pricing.currency ?? 'USD',
                exchangeRate: pricing.exchangeRate,
                basePrice: pricing.basePrice ?? 0,
                minParticipants: pricing.minParticipants ?? null,
                maxParticipants: pricing.maxParticipants ?? null,
                maxPeople: pricing.maxPeople ?? null,
                validFrom: pricing.validFrom ?? null,
                validTo: pricing.validTo ?? null,
                categoryPrices: pricing.categoryPrices ?? {},
              },
            });

            if (pricing.slots?.length) {
              await tx.pricingSlot.createMany({
                data: pricing.slots.map((slot) => ({
                  pricingId: createdPricing.id,
                  date: slot.date ?? null,
                  dayOfWeek: slot.dayOfWeek ?? null,
                  startTime: slot.startTime ?? null,
                  endTime: slot.endTime ?? null,
                  price: slot.price,
                  capacity: slot.capacity ?? null,
                })),
              });
            }
            if (dto.ticketTypes?.length) {
              await tx.experienceTicketType.createMany({
                data: dto.ticketTypes.map((ticket, index) => ({
                  experienceId: id,
                  pricingId: ticket.pricingId ?? null,
                  code: ticket.code,
                  label: ticket.label,
                  description: ticket.description ?? null,
                  minAge: ticket.minAge ?? null,
                  maxAge: ticket.maxAge ?? null,
                  basePrice: ticket.basePrice,
                  active: ticket.active ?? true,
                  sortOrder: ticket.sortOrder ?? index,
                })),
                skipDuplicates: true,
              });
            }
          }
        }

        return updated;
      },
      { timeout: 20000 },
    );
  }

  async deleteExperience(id: string) {
    return this.prisma.experience.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
      },
    });
  }

  async publishExperience(id: string) {
    return this.prisma.experience.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
      },
    });
  }

  async checkAvailability(
    experienceId: string,
    date: string,
    participants = 1,
  ) {
    const targetDate = new Date(date);

    const [pricings, overrides, reservations, bookings] = await Promise.all([
      this.prisma.experiencePricing.findMany({
        where: {
          experienceId,
          active: true,
        },
        include: {
          slots: true,
          ticketTypes: {
            where: { active: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),

      this.prisma.experienceAvailability.findMany({
        where: {
          experienceId,
          date: targetDate,
        },
      }),

      this.prisma.reservation.findMany({
        where: {
          experienceId,
          date: targetDate,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
      }),

      this.prisma.booking.findMany({
        where: {
          experienceId,
          date: targetDate,
          status: {
            in: ['CONFIRMED', 'PAYMENT_PENDING', 'RESERVED'],
          },
        },
      }),
    ]);

    const reservationSeatsBySlot = reservations.reduce<Record<string, number>>(
      (acc, reservation) => {
        const key = `${reservation.pricingId}:${reservation.startTime ?? ''}`;
        acc[key] = (acc[key] ?? 0) + reservation.seats;
        return acc;
      },
      {},
    );
    const bookingSeatsBySlot = bookings.reduce<Record<string, number>>(
      (acc, booking) => {
        const key = `${booking.pricingId}:${booking.startTime ?? ''}`;
        acc[key] = (acc[key] ?? 0) + booking.participants;
        return acc;
      },
      {},
    );

    const options = pricings.map((pricing) => {
      // ===============================
      // NON-SLOT PRICING
      // ===============================
      if (!pricing.slots.length) {
        const override = overrides.find(
          (o) => (o.startTime ?? null) === null && (o.endTime ?? null) === null,
        );

        if (override?.isBlocked) {
          return {
            pricing,
            ticketTypes: pricing.ticketTypes,
            slots: [],
            isSoldOut: true,
          };
        }

        const capacity =
          override?.bookingCapacitySnapshot ??
          pricing.maxPeople ??
          pricing.maxParticipants ??
          999;

        const noSlotKey = `${pricing.id}:`;
        const reserved = reservationSeatsBySlot[noSlotKey] ?? 0;
        const booked = bookingSeatsBySlot[noSlotKey] ?? 0;

        const availableSeats = Math.max(0, capacity - reserved - booked);

        return {
          pricing,
          ticketTypes: pricing.ticketTypes,
          slots: [
            {
              startTime: null,
              endTime: null,
              price: pricing.basePrice ?? 0,
              availableSeats,
              isAvailable: availableSeats >= participants,
            },
          ],
          isSoldOut: availableSeats < participants,
        };
      }

      // ===============================
      // SLOT-BASED PRICING
      // ===============================
      const slots = pricing.slots
        .map((slot) => {
          let capacity =
            slot.capacity ??
            pricing.maxPeople ??
            pricing.maxParticipants ??
            999;

          const override = overrides.find(
            (o) =>
              (o.startTime ?? null) === (slot.startTime ?? null) &&
              (o.endTime ?? null) === (slot.endTime ?? null),
          );

          if (override?.isBlocked) {
            return null;
          }

          if (override?.bookingCapacitySnapshot != null) {
            capacity = override.bookingCapacitySnapshot;
          }

          const slotKey = `${pricing.id}:${slot.startTime ?? ''}`;
          const reserved = reservationSeatsBySlot[slotKey] ?? 0;
          const booked = bookingSeatsBySlot[slotKey] ?? 0;

          const availableSeats = Math.max(0, capacity - reserved - booked);

          return {
            startTime: slot.startTime,
            endTime: slot.endTime,
            price: slot.price ?? pricing.basePrice ?? 0,
            availableSeats,
            isAvailable: availableSeats >= participants,
          };
        })
        .filter((slot): slot is NonNullable<typeof slot> => slot !== null);

      const isSoldOut =
        slots.length > 0 ? slots.every((s) => !s.isAvailable) : true;

      return {
        pricing,
        ticketTypes: pricing.ticketTypes,
        slots,
        isSoldOut,
      };
    });

    return { options };
  }

  async getAvailableOptions(
    experienceId: string,
    date: string,
    participants = 1,
  ) {
    const data = await this.checkAvailability(experienceId, date, participants);

    return {
      options: await Promise.all(
        data.options.map(async (opt) => {
          if (!opt.isSoldOut) return opt;

          const nextDate = await this.getNextAvailableDate(
            experienceId,
            opt.pricing.id,
          );

          return {
            ...opt,
            nextAvailableDate: nextDate,
          };
        }),
      ),
    };
  }

  async getNextAvailableDate(experienceId: string, pricingId: string) {
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const availability = await this.checkAvailability(
        experienceId,
        date.toISOString(),
        1,
      );

      const pricing = availability.options.find(
        (p) => p.pricing.id === pricingId,
      );

      if (pricing && !pricing.isSoldOut) {
        return date;
      }
    }

    return null;
  }
}
