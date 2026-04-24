// import {
//   Injectable,
//   BadRequestException,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';

// import { BookingStatus } from '@prisma/client';
// import { CreateBookingDto } from './dto/createBooking.dto';

// @Injectable()
// export class BookingService {
//   constructor(private readonly prisma: PrismaService) {}

//   // ────────────────────────────────────────────────
//   // CREATE BOOKING
//   // ────────────────────────────────────────────────
//   // async createBooking(dto: CreateBookingDto, userId: string) {
//   //   const { experienceId, numOfPeople, date } = dto;

//   //   // Check if experience exists
//   //   const experience = await this.prisma.experience.findUnique({
//   //     where: { id: experienceId },
//   //   });

//   //   if (!experience) {
//   //     throw new NotFoundException('Experience not found');
//   //   }

//   //   // Auto-calculate totalAmount using price * numOfPeople
//   //   const totalAmount = dto.totalAmount ?? experience.price * numOfPeople;

//   //   const booking = await this.prisma.booking.create({
//   //     data: {
//   //       userId,
//   //       experienceId,
//   //       numOfPeople,
//   //       totalAmount,
//   //       date: new Date(date),
//   //       status: BookingStatus.PENDING,
//   //       paymentId: dto.paymentId ?? null,
//   //     },
//   //   });

//   //   return booking;
//   // }

//   async createReservation(dto: CreateReservationDto, userId?: string) {
//   const bookingDate = new Date(dto.date);

//   return this.prisma.$transaction(async (tx) => {
//     const pricing = await tx.experiencePricing.findFirst({
//       where: {
//         id: dto.pricingId,
//         experienceId: dto.experienceId,
//         active: true,
//       },
//       include: {
//         slots: true,
//       },
//     });

//     if (!pricing) {
//       throw new NotFoundException('Pricing not found');
//     }

//     const slot = pricing.slots.find((s) => {
//       if (s.date) {
//         return new Date(s.date).toDateString() === bookingDate.toDateString()
//           && s.startTime === dto.startTime;
//       }

//       return s.dayOfWeek === bookingDate.getDay() && s.startTime === dto.startTime;
//     });

//     if (!slot) {
//       throw new BadRequestException('Selected slot is not available');
//     }

//     const ticketTypes = await tx.experienceTicketType.findMany({
//       where: {
//         experienceId: dto.experienceId,
//         pricingId: dto.pricingId,
//         active: true,
//       },
//     });

//     const ticketMap = new Map(ticketTypes.map((t) => [t.code, t]));
//     const totalSeats = dto.tickets.reduce((sum, t) => sum + t.quantity, 0);

//     if (totalSeats <= 0) {
//       throw new BadRequestException('At least one ticket is required');
//     }

//     const override = await tx.experienceAvailability.findFirst({
//       where: {
//         experienceId: dto.experienceId,
//         date: bookingDate,
//       },
//     });

//     if (override?.isBlocked) {
//       throw new BadRequestException('Experience is blocked on selected date');
//     }

//     const capacity = override?.bookingCapacitySnapshot ?? slot.capacity ?? pricing.maxPeople ?? 9999;

//     const activeReservations = await tx.reservation.aggregate({
//       _sum: { seats: true },
//       where: {
//         experienceId: dto.experienceId,
//         pricingId: dto.pricingId,
//         date: bookingDate,
//         startTime: dto.startTime,
//         status: 'ACTIVE',
//         expiresAt: { gt: new Date() },
//       },
//     });

//     const confirmedBookings = await tx.booking.aggregate({
//       _sum: { participants: true },
//       where: {
//         experienceId: dto.experienceId,
//         pricingId: dto.pricingId,
//         date: bookingDate,
//         startTime: dto.startTime,
//         status: 'CONFIRMED',
//       },
//     });

//     const usedSeats =
//       (activeReservations._sum.seats ?? 0) +
//       (confirmedBookings._sum.participants ?? 0);

//     if (usedSeats + totalSeats > capacity) {
//       throw new BadRequestException('Not enough seats available');
//     }

//     const normalizedItems = dto.tickets.map((row) => {
//       const ticket = ticketMap.get(row.ticketType);
//       if (!ticket) {
//         throw new BadRequestException(`Invalid ticket type: ${row.ticketType}`);
//       }

//       const totalPrice = ticket.basePrice * row.quantity;

//       return {
//         ticketType: ticket.code,
//         label: ticket.label,
//         quantity: row.quantity,
//         unitPrice: ticket.basePrice,
//         totalPrice,
//       };
//     });

//     const finalAmount = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);

//     const reservation = await tx.reservation.create({
//       data: {
//         experienceId: dto.experienceId,
//         pricingId: dto.pricingId,
//         userId,
//         date: bookingDate,
//         startTime: dto.startTime,
//         seats: totalSeats,
//         ticketBreakdown: normalizedItems,
//         unitSnapshot: {
//           pricingId: pricing.id,
//           slotId: slot.id,
//           currency: pricing.currency,
//         },
//         expiresAt: new Date(Date.now() + 10 * 60 * 1000),
//         status: 'ACTIVE',
//       },
//     });

//     return {
//       reservationId: reservation.id,
//       expiresAt: reservation.expiresAt,
//       currency: pricing.currency,
//       items: normalizedItems,
//       totalSeats,
//       finalAmount,
//     };
//   });
// }

// async confirmBookingFromReservation(reservationId: string, paymentId: string) {
//   return this.prisma.$transaction(async (tx) => {
//     const reservation = await tx.reservation.findUnique({
//       where: { id: reservationId },
//     });

//     if (!reservation) {
//       throw new NotFoundException('Reservation not found');
//     }

//     if (reservation.status !== 'ACTIVE') {
//       throw new BadRequestException('Reservation is no longer active');
//     }

//     if (reservation.expiresAt <= new Date()) {
//       throw new BadRequestException('Reservation expired');
//     }

//     const breakdown = Array.isArray(reservation.ticketBreakdown)
//       ? reservation.ticketBreakdown
//       : [];

//     const totalAmount = breakdown.reduce(
//       (sum: number, item: any) => sum + Number(item.totalPrice || 0),
//       0,
//     );

//     const booking = await tx.booking.create({
//       data: {
//         userId: reservation.userId!,
//         experienceId: reservation.experienceId,
//         pricingId: reservation.pricingId,
//         reservationId: reservation.id,
//         date: reservation.date,
//         startTime: reservation.startTime,
//         participants: reservation.seats,
//         currency: (reservation.unitSnapshot as any)?.currency ?? 'USD',
//         pricingSnapshot: reservation.unitSnapshot ?? {},
//         finalAmount: totalAmount,
//         status: 'CONFIRMED',
//         items: {
//           create: breakdown.map((item: any) => ({
//             ticketType: item.ticketType,
//             quantity: item.quantity,
//             unitPrice: item.unitPrice,
//             totalPrice: item.totalPrice,
//             meta: { label: item.label },
//           })),
//         },
//         payments: {
//           create: {
//             amount: totalAmount,
//             currency: (reservation.unitSnapshot as any)?.currency ?? 'USD',
//             method: 'STRIPE',
//             status: 'SUCCESS',
//             bookingId: undefined,
//             transactionId: paymentId,
//           },
//         },
//       },
//       include: {
//         items: true,
//         payments: true,
//       },
//     });

//     await tx.reservation.update({
//       where: { id: reservation.id },
//       data: { status: 'CONVERTED' },
//     });

//     return booking;
//   });
// }

//   async createBooking(dto: CreateBookingDto, userId: string) {
//     const { experienceId, pricingId, participants, date, startTime, endTime } =
//       dto;

//     const bookingDate = new Date(date);

//     return this.prisma.$transaction(async (tx) => {
//       // ================= EXPERIENCE
//       const experience = await tx.experience.findFirst({
//         where: {
//           id: experienceId,
//           deletedAt: null,
//           status: 'PUBLISHED',
//         },
//       });

//       if (!experience) {
//         throw new NotFoundException('Experience not found');
//       }

//       // ================= PRICING
//       const pricing = await tx.experiencePricing.findFirst({
//         where: {
//           id: pricingId,
//           experienceId,
//           active: true,
//         },
//         include: {
//           slots: true,
//         },
//       });

//       if (!pricing) {
//         throw new NotFoundException('Pricing not found');
//       }

//       // ================= VALID DATE WINDOW
//       if (
//         (pricing.validFrom && bookingDate < pricing.validFrom) ||
//         (pricing.validTo && bookingDate > pricing.validTo)
//       ) {
//         throw new BadRequestException('Pricing not valid for selected date');
//       }

//       // ================= PARTICIPANT VALIDATION
//       if (pricing.minParticipants && participants < pricing.minParticipants) {
//         throw new BadRequestException(
//           `Minimum participants is ${pricing.minParticipants}`,
//         );
//       }

//       if (pricing.maxParticipants && participants > pricing.maxParticipants) {
//         throw new BadRequestException(
//           `Maximum participants is ${pricing.maxParticipants}`,
//         );
//       }

//       // ================= AVAILABILITY OVERRIDE
//       const override = await tx.experienceAvailability.findFirst({
//         where: {
//           experienceId,
//           date: bookingDate,
//         },
//       });

//       if (override?.isBlocked) {
//         throw new BadRequestException('Experience not available on this date');
//       }

//       let pricePerUnit = pricing.basePrice ?? 0;

//       // ================= SLOT LOGIC
//       if (
//         (pricing.type === 'HOURLY' || pricing.type === 'DAILY') &&
//         pricing.slots.length
//       ) {
//         const dayOfWeek = bookingDate.getDay();

//         const slot = pricing.slots.find((s) => {
//           // date override
//           if (s.date) {
//             return (
//               new Date(s.date).toDateString() === bookingDate.toDateString()
//             );
//           }

//           // recurring
//           if (s.dayOfWeek !== null && s.dayOfWeek === dayOfWeek) {
//             if (pricing.type === 'HOURLY') {
//               return s.startTime === startTime;
//             }
//             return true;
//           }

//           return false;
//         });

//         if (!slot) {
//           throw new BadRequestException(
//             'No pricing available for selected time',
//           );
//         }

//         pricePerUnit = slot.price;

//         // ================= CAPACITY CHECK
//         const capacity = override?.bookingCapacitySnapshot ?? slot.capacity;

//         if (capacity) {
//           const existing = await tx.booking.aggregate({
//             _sum: { participants: true },
//             where: {
//               pricingId,
//               date: bookingDate,
//               status: {
//                 in: ['PENDING', 'CONFIRMED'],
//               },
//             },
//           });

//           const used = existing._sum.participants ?? 0;

//           if (used + participants > capacity) {
//             throw new BadRequestException('Not enough capacity available');
//           }
//         }
//       }

//       // ================= TOTAL CALCULATION
//       let totalAmount = 0;

//       switch (pricing.type) {
//         case 'PER_PERSON':
//           totalAmount = pricePerUnit * participants;
//           break;

//         case 'PER_GROUP':
//           if (pricing.maxPeople && participants > pricing.maxPeople) {
//             throw new BadRequestException(
//               `Maximum group size is ${pricing.maxPeople}`,
//             );
//           }

//           totalAmount = pricePerUnit;
//           break;

//         case 'HOURLY':
//         case 'DAILY':
//           totalAmount = pricePerUnit * participants;
//           break;

//         default:
//           totalAmount = pricePerUnit;
//       }

//       // ================= CREATE BOOKING
//       const booking = await tx.booking.create({
//         data: {
//           userId,
//           experienceId,
//           pricingId,

//           date: bookingDate,
//           startTime,
//           endTime,

//           participants,

//           pricingType: pricing.type,
//         pricingSnapshot: pricing ,
//           finalAmount: totalAmount,
//           currency: pricing.currency,

//           status: 'PENDING',
//         },
//       });

//       return booking;
//     });
//   }

//   // ────────────────────────────────────────────────
//   // USER BOOKINGS (customer sees his own bookings)
//   // ────────────────────────────────────────────────
//   async getUserBookings(userId: string) {
//     return this.prisma.booking.findMany({
//       where: { userId },
//       include: {
//         experience: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   // ────────────────────────────────────────────────
//   // VENDOR BOOKINGS (vendor sees bookings for his experiences)
//   // ────────────────────────────────────────────────
//   // ────────────────────────────────────────────────
//   // GET VENDOR BOOKINGS (find vendorProfile first)
//   // ────────────────────────────────────────────────
//   async getVendorBookings(userId: string) {
//     // 1. Find vendor profile by userId
//     const vendorProfile = await this.prisma.vendorProfile.findUnique({
//       where: { userId },
//     });

//     if (!vendorProfile) {
//       throw new NotFoundException('Vendor profile not found for this user');
//     }

//     // 2. Find bookings for experiences owned by this vendor
//     return this.prisma.booking.findMany({
//       where: {
//         experience: {
//           vendorId: vendorProfile.id, // match vendorProfile.id
//         },
//       },
//       include: {
//         user: true,
//         experience: true,
//         // payment: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   // ────────────────────────────────────────────────
//   // UPDATE BOOKING STATUS (CONFIRMED, CANCELLED, COMPLETED)
//   // ────────────────────────────────────────────────
//   async updateBookingStatus(bookingId: string, status: BookingStatus) {
//     if (!Object.values(BookingStatus).includes(status)) {
//       throw new BadRequestException('Invalid booking status');
//     }

//     // Ensure booking exists
//     const booking = await this.prisma.booking.findUnique({
//       where: { id: bookingId },
//     });

//     if (!booking) throw new NotFoundException('Booking not found');

//     return this.prisma.booking.update({
//       where: { id: bookingId },
//       data: { status },
//     });
//   }

//   // ────────────────────────────────────────────────
//   // CANCEL BOOKING (sets status → CANCELLED)
//   // ────────────────────────────────────────────────
//   async cancelBooking(bookingId: string) {
//     const booking = await this.prisma.booking.findUnique({
//       where: { id: bookingId },
//     });

//     if (!booking) throw new NotFoundException('Booking not found');

//     return this.prisma.booking.update({
//       where: { id: bookingId },
//       data: { status: BookingStatus.CANCELLED },
//     });
//   }
// }

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, ReservationStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookingDto } from './dto/createBooking.dto';
import { CreateReservationDto } from './dto/ReservationTicket.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async createReservation(dto: CreateReservationDto, userId?: string) {
    const bookingDate = new Date(dto.date);
    if (Number.isNaN(bookingDate.getTime())) {
      throw new BadRequestException('Invalid booking date');
    }

    return this.prisma.$transaction(async (tx) => {
      const experience = await tx.experience.findFirst({
        where: {
          id: dto.experienceId,
          deletedAt: null,
          status: 'PUBLISHED',
          available: true,
        },
      });

      if (!experience) {
        throw new NotFoundException('Experience not found');
      }

      const pricing = await tx.experiencePricing.findFirst({
        where: {
          id: dto.pricingId,
          experienceId: dto.experienceId,
          active: true,
        },
        include: {
          slots: true,
        },
      });

      if (!pricing) {
        throw new NotFoundException('Pricing not found');
      }

      if (pricing.type === 'HOURLY' && !dto.startTime) {
        throw new BadRequestException(
          'startTime is required for hourly reservations',
        );
      }

      if (
        (pricing.validFrom && bookingDate < pricing.validFrom) ||
        (pricing.validTo && bookingDate > pricing.validTo)
      ) {
        throw new BadRequestException('Pricing not valid for selected date');
      }

      const slot = pricing.slots.find((s) => {
        if (s.date) {
          return (
            new Date(s.date).toDateString() === bookingDate.toDateString() &&
            s.startTime === dto.startTime
          );
        }

        return (
          s.dayOfWeek === bookingDate.getDay() && s.startTime === dto.startTime
        );
      });

      if (!slot) {
        throw new BadRequestException('Selected slot is not available');
      }

      const ticketTypes = await tx.experienceTicketType.findMany({
        where: {
          experienceId: dto.experienceId,
          pricingId: dto.pricingId,
          active: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

      if (!ticketTypes.length) {
        throw new BadRequestException('No active ticket types found');
      }

      const ticketMap = new Map(ticketTypes.map((t) => [t.code, t]));

      const totalSeats = dto.tickets.reduce((sum, row) => {
        if (row.quantity <= 0) {
          throw new BadRequestException(
            'Ticket quantity must be greater than 0',
          );
        }
        return sum + row.quantity;
      }, 0);

      if (totalSeats <= 0) {
        throw new BadRequestException('At least one ticket is required');
      }

      if (pricing.minParticipants && totalSeats < pricing.minParticipants) {
        throw new BadRequestException(
          `Minimum participants is ${pricing.minParticipants}`,
        );
      }

      if (pricing.maxParticipants && totalSeats > pricing.maxParticipants) {
        throw new BadRequestException(
          `Maximum participants is ${pricing.maxParticipants}`,
        );
      }

      const override = await tx.experienceAvailability.findFirst({
        where: {
          experienceId: dto.experienceId,
          date: bookingDate,
          ...(dto.startTime ? { startTime: dto.startTime } : {}),
        },
      });

      if (override?.isBlocked) {
        throw new BadRequestException('Experience is blocked on selected date');
      }

      const capacity =
        override?.bookingCapacitySnapshot ??
        slot.capacity ??
        pricing.maxPeople ??
        9999;

      const activeReservations = await tx.reservation.aggregate({
        _sum: { seats: true },
        where: {
          experienceId: dto.experienceId,
          pricingId: dto.pricingId,
          date: bookingDate,
          startTime: dto.startTime,
          status: ReservationStatus.ACTIVE,
          expiresAt: { gt: new Date() },
        },
      });

      const blockingBookings = await tx.booking.aggregate({
        _sum: { participants: true },
        where: {
          experienceId: dto.experienceId,
          pricingId: dto.pricingId,
          date: bookingDate,
          startTime: dto.startTime,
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESERVED,
              BookingStatus.PAYMENT_PENDING,
            ],
          },
        },
      });

      const usedSeats =
        (activeReservations._sum.seats ?? 0) +
        (blockingBookings._sum.participants ?? 0);

      if (usedSeats + totalSeats > capacity) {
        throw new BadRequestException('Not enough seats available');
      }

      const normalizedItems = dto.tickets.map((row) => {
        const ticket = ticketMap.get(row.ticketType);

        if (!ticket) {
          throw new BadRequestException(
            `Invalid ticket type: ${row.ticketType}`,
          );
        }

        const totalPrice = ticket.basePrice * row.quantity;

        return {
          ticketType: ticket.code,
          label: ticket.label,
          quantity: row.quantity,
          unitPrice: ticket.basePrice,
          totalPrice,
        };
      });

      const finalAmount = normalizedItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );

      const reservation = await tx.reservation.create({
        data: {
          experienceId: dto.experienceId,
          pricingId: dto.pricingId,
          userId,
          date: bookingDate,
          startTime: dto.startTime,
          seats: totalSeats,
          ticketBreakdown: normalizedItems,
          unitSnapshot: {
            experienceId: dto.experienceId,
            pricingId: pricing.id,
            slotId: slot.id,
            startTime: dto.startTime,
            endTime: slot.endTime,
            currency: pricing.currency,
            pricingType: pricing.type,
          },
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          status: ReservationStatus.ACTIVE,
        },
      });

      return {
        reservationId: reservation.id,
        expiresAt: reservation.expiresAt,
        currency: pricing.currency,
        items: normalizedItems,
        totalSeats,
        finalAmount,
      };
    });
  }

  async confirmBookingFromReservation(
    reservationId: string,
    paymentId: string,
    userId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      if (reservation.status !== ReservationStatus.ACTIVE) {
        throw new BadRequestException('Reservation is no longer active');
      }

      if (reservation.expiresAt <= new Date()) {
        throw new BadRequestException('Reservation expired');
      }

      const finalUserId = reservation.userId ?? userId;

      if (!finalUserId) {
        throw new BadRequestException('User is required to confirm booking');
      }

      const experience = await tx.experience.findFirst({
        where: {
          id: reservation.experienceId,
          deletedAt: null,
          status: 'PUBLISHED',
          available: true,
        },
      });

      if (!experience) {
        throw new BadRequestException('Experience is no longer available');
      }

      const override = await tx.experienceAvailability.findFirst({
        where: {
          experienceId: reservation.experienceId,
          date: reservation.date,
          ...(reservation.startTime
            ? { startTime: reservation.startTime }
            : {}),
        },
      });

      if (override?.isBlocked) {
        throw new BadRequestException('Selected slot is no longer available');
      }

      // const breakdown = Array.isArray(reservation.ticketBreakdown)
      //   ? reservation.ticketBreakdown
      //   : [];

      // if (!breakdown.length) {
      //   throw new BadRequestException('Reservation has no ticket breakdown');
      // }

      // const totalAmount = breakdown.reduce(
      //   (sum: number, item: any) => sum + Number(item.totalPrice || 0),
      //   0,
      // );
      type ReservationBreakdownItem = {
        ticketType: string;
        label?: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      };

      const rawBreakdown = Array.isArray(reservation.ticketBreakdown)
        ? reservation.ticketBreakdown
        : [];

      const breakdown: ReservationBreakdownItem[] = rawBreakdown.map(
        (item: any) => ({
          ticketType: String(item.ticketType),
          label: item.label ? String(item.label) : undefined,
          quantity: Number(item.quantity ?? 0),
          unitPrice: Number(item.unitPrice ?? 0),
          totalPrice: Number(item.totalPrice ?? 0),
        }),
      );

      if (!breakdown.length) {
        throw new BadRequestException('Reservation has no ticket breakdown');
      }

      const totalAmount: number = breakdown.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );

      const booking = await tx.booking.create({
        data: {
          userId: finalUserId,
          experienceId: reservation.experienceId,
          pricingId: reservation.pricingId,
          reservationId: reservation.id,
          date: reservation.date,
          startTime: reservation.startTime,
          participants: reservation.seats,
          pricingType: (reservation.unitSnapshot as any)?.pricingType,
          currency: (reservation.unitSnapshot as any)?.currency ?? 'USD',
          pricingSnapshot: reservation.unitSnapshot ?? {},
          finalAmount: totalAmount,
          status: BookingStatus.CONFIRMED,
          items: {
            create: breakdown.map((item: any) => ({
              ticketType: item.ticketType,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              meta: { label: item.label },
            })),
          },
          payments: {
            create: {
              amount: totalAmount,
              currency: (reservation.unitSnapshot as any)?.currency ?? 'USD',
              method: 'STRIPE',
              status: 'SUCCESS',
              transactionId: paymentId,
            },
          },
        },
        include: {
          items: true,
          payments: true,
        },
      });

      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.CONVERTED },
      });

      return booking;
    });
  }

  async createBooking(dto: CreateBookingDto, userId: string) {
    const { experienceId, pricingId, participants, date, startTime, endTime } =
      dto;

    const bookingDate = new Date(date);
    if (Number.isNaN(bookingDate.getTime())) {
      throw new BadRequestException('Invalid booking date');
    }

    return this.prisma.$transaction(async (tx) => {
      const experience = await tx.experience.findFirst({
        where: {
          id: experienceId,
          deletedAt: null,
          status: 'PUBLISHED',
          available: true,
        },
      });

      if (!experience) {
        throw new NotFoundException('Experience not found');
      }

      const pricing = await tx.experiencePricing.findFirst({
        where: {
          id: pricingId,
          experienceId,
          active: true,
        },
        include: {
          slots: true,
        },
      });

      if (!pricing) {
        throw new NotFoundException('Pricing not found');
      }

      if (pricing.type === 'HOURLY' && !startTime) {
        throw new BadRequestException(
          'startTime is required for hourly bookings',
        );
      }

      if (
        (pricing.validFrom && bookingDate < pricing.validFrom) ||
        (pricing.validTo && bookingDate > pricing.validTo)
      ) {
        throw new BadRequestException('Pricing not valid for selected date');
      }

      if (pricing.minParticipants && participants < pricing.minParticipants) {
        throw new BadRequestException(
          `Minimum participants is ${pricing.minParticipants}`,
        );
      }

      if (pricing.maxParticipants && participants > pricing.maxParticipants) {
        throw new BadRequestException(
          `Maximum participants is ${pricing.maxParticipants}`,
        );
      }

      const override = await tx.experienceAvailability.findFirst({
        where: {
          experienceId,
          date: bookingDate,
          ...(startTime ? { startTime } : {}),
        },
      });

      if (override?.isBlocked) {
        throw new BadRequestException('Experience not available on this date');
      }

      let pricePerUnit = pricing.basePrice ?? 0;
      let matchedSlot:
        | {
            id: string;
            price: number;
            capacity: number | null;
            endTime: string | null;
          }
        | undefined;

      if (
        (pricing.type === 'HOURLY' || pricing.type === 'DAILY') &&
        pricing.slots.length
      ) {
        const dayOfWeek = bookingDate.getDay();

        const slot = pricing.slots.find((s) => {
          if (s.date) {
            if (pricing.type === 'HOURLY') {
              return (
                new Date(s.date).toDateString() ===
                  bookingDate.toDateString() && s.startTime === startTime
              );
            }
            return (
              new Date(s.date).toDateString() === bookingDate.toDateString()
            );
          }

          if (s.dayOfWeek !== null && s.dayOfWeek === dayOfWeek) {
            if (pricing.type === 'HOURLY') {
              return s.startTime === startTime;
            }
            return true;
          }

          return false;
        });

        if (!slot) {
          throw new BadRequestException(
            'No pricing available for selected time',
          );
        }

        matchedSlot = {
          id: slot.id,
          price: slot.price,
          capacity: slot.capacity ?? null,
          endTime: slot.endTime ?? null,
        };

        pricePerUnit = slot.price;

        const capacity =
          override?.bookingCapacitySnapshot ??
          slot.capacity ??
          pricing.maxPeople ??
          null;

        if (capacity !== null) {
          const activeReservations = await tx.reservation.aggregate({
            _sum: { seats: true },
            where: {
              experienceId,
              pricingId,
              date: bookingDate,
              ...(startTime ? { startTime } : {}),
              status: ReservationStatus.ACTIVE,
              expiresAt: { gt: new Date() },
            },
          });

          const existing = await tx.booking.aggregate({
            _sum: { participants: true },
            where: {
              pricingId,
              date: bookingDate,
              ...(startTime ? { startTime } : {}),
              status: {
                in: [
                  BookingStatus.PENDING,
                  BookingStatus.CONFIRMED,
                  BookingStatus.RESERVED,
                  BookingStatus.PAYMENT_PENDING,
                ],
              },
            },
          });

          const used =
            (activeReservations._sum.seats ?? 0) +
            (existing._sum.participants ?? 0);

          if (used + participants > capacity) {
            throw new BadRequestException('Not enough capacity available');
          }
        }
      }

      let totalAmount = 0;

      switch (pricing.type) {
        case 'PER_PERSON':
          totalAmount = pricePerUnit * participants;
          break;

        case 'PER_GROUP':
          if (pricing.maxPeople && participants > pricing.maxPeople) {
            throw new BadRequestException(
              `Maximum group size is ${pricing.maxPeople}`,
            );
          }
          totalAmount = pricePerUnit;
          break;

        case 'HOURLY':
        case 'DAILY':
          totalAmount = pricePerUnit * participants;
          break;

        default:
          totalAmount = pricePerUnit;
      }

      const booking = await tx.booking.create({
        data: {
          userId,
          experienceId,
          pricingId,
          date: bookingDate,
          startTime,
          endTime: endTime ?? matchedSlot?.endTime ?? null,
          participants,
          pricingType: pricing.type,
          pricingSnapshot: {
            pricingId: pricing.id,
            pricingType: pricing.type,
            currency: pricing.currency,
            basePrice: pricing.basePrice,
            selectedStartTime: startTime,
            selectedEndTime: endTime ?? matchedSlot?.endTime ?? null,
            selectedSlotId: matchedSlot?.id ?? null,
            selectedSlotPrice: matchedSlot?.price ?? pricePerUnit,
          },
          finalAmount: totalAmount,
          currency: pricing.currency,
          status: BookingStatus.PENDING,
        },
      });

      return booking;
    });
  }

  async getUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        experience: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVendorBookings(userId: string) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found for this user');
    }

    return this.prisma.booking.findMany({
      where: {
        experience: {
          vendorId: vendorProfile.id,
        },
      },
      include: {
        user: true,
        experience: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus) {
    if (!Object.values(BookingStatus).includes(status)) {
      throw new BadRequestException('Invalid booking status');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  async cancelBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
  }
}
