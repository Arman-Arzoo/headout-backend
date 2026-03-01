import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/createBooking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────
  // CREATE BOOKING
  // ────────────────────────────────────────────────
  // async createBooking(dto: CreateBookingDto, userId: string) {
  //   const { experienceId, numOfPeople, date } = dto;

  //   // Check if experience exists
  //   const experience = await this.prisma.experience.findUnique({
  //     where: { id: experienceId },
  //   });

  //   if (!experience) {
  //     throw new NotFoundException('Experience not found');
  //   }

  //   // Auto-calculate totalAmount using price * numOfPeople
  //   const totalAmount = dto.totalAmount ?? experience.price * numOfPeople;

  //   const booking = await this.prisma.booking.create({
  //     data: {
  //       userId,
  //       experienceId,
  //       numOfPeople,
  //       totalAmount,
  //       date: new Date(date),
  //       status: BookingStatus.PENDING,
  //       paymentId: dto.paymentId ?? null,
  //     },
  //   });

  //   return booking;
  // }

  async createBooking(dto: CreateBookingDto, userId: string) {
    const { experienceId, pricingId, participants, date, startTime, endTime } =
      dto;

    const bookingDate = new Date(date);

    return this.prisma.$transaction(async (tx) => {
      // ================= EXPERIENCE
      const experience = await tx.experience.findFirst({
        where: {
          id: experienceId,
          deletedAt: null,
          status: 'PUBLISHED',
        },
      });

      if (!experience) {
        throw new NotFoundException('Experience not found');
      }

      // ================= PRICING
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

      // ================= VALID DATE WINDOW
      if (
        (pricing.validFrom && bookingDate < pricing.validFrom) ||
        (pricing.validTo && bookingDate > pricing.validTo)
      ) {
        throw new BadRequestException('Pricing not valid for selected date');
      }

      // ================= PARTICIPANT VALIDATION
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

      // ================= AVAILABILITY OVERRIDE
      const override = await tx.experienceAvailability.findFirst({
        where: {
          experienceId,
          date: bookingDate,
        },
      });

      if (override?.isBlocked) {
        throw new BadRequestException('Experience not available on this date');
      }

      let pricePerUnit = pricing.basePrice ?? 0;

      // ================= SLOT LOGIC
      if (
        (pricing.type === 'HOURLY' || pricing.type === 'DAILY') &&
        pricing.slots.length
      ) {
        const dayOfWeek = bookingDate.getDay();

        const slot = pricing.slots.find((s) => {
          // date override
          if (s.date) {
            return (
              new Date(s.date).toDateString() === bookingDate.toDateString()
            );
          }

          // recurring
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

        pricePerUnit = slot.price;

        // ================= CAPACITY CHECK
        const capacity = override?.capacityOverride ?? slot.capacity;

        if (capacity) {
          const existing = await tx.booking.aggregate({
            _sum: { participants: true },
            where: {
              pricingId,
              date: bookingDate,
              status: {
                in: ['PENDING', 'CONFIRMED'],
              },
            },
          });

          const used = existing._sum.participants ?? 0;

          if (used + participants > capacity) {
            throw new BadRequestException('Not enough capacity available');
          }
        }
      }

      // ================= TOTAL CALCULATION
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

      // ================= CREATE BOOKING
      const booking = await tx.booking.create({
        data: {
          userId,
          experienceId,
          pricingId,

          date: bookingDate,
          startTime,
          endTime,

          participants,

          pricingType: pricing.type,
          pricePerUnit,
          totalAmount,
          currency: pricing.currency,

          status: 'PENDING',
        },
      });

      return booking;
    });
  }

  // ────────────────────────────────────────────────
  // USER BOOKINGS (customer sees his own bookings)
  // ────────────────────────────────────────────────
  async getUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        experience: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ────────────────────────────────────────────────
  // VENDOR BOOKINGS (vendor sees bookings for his experiences)
  // ────────────────────────────────────────────────
  // ────────────────────────────────────────────────
  // GET VENDOR BOOKINGS (find vendorProfile first)
  // ────────────────────────────────────────────────
  async getVendorBookings(userId: string) {
    // 1. Find vendor profile by userId
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found for this user');
    }

    // 2. Find bookings for experiences owned by this vendor
    return this.prisma.booking.findMany({
      where: {
        experience: {
          vendorId: vendorProfile.id, // match vendorProfile.id
        },
      },
      include: {
        user: true,
        experience: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ────────────────────────────────────────────────
  // UPDATE BOOKING STATUS (CONFIRMED, CANCELLED, COMPLETED)
  // ────────────────────────────────────────────────
  async updateBookingStatus(bookingId: string, status: BookingStatus) {
    if (!Object.values(BookingStatus).includes(status)) {
      throw new BadRequestException('Invalid booking status');
    }

    // Ensure booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  // ────────────────────────────────────────────────
  // CANCEL BOOKING (sets status → CANCELLED)
  // ────────────────────────────────────────────────
  async cancelBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
  }
}
