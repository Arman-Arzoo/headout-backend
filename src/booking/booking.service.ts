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
  async createBooking(dto: CreateBookingDto, userId: string) {
    const { experienceId, numOfPeople, date } = dto;

    // Check if experience exists
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    // Auto-calculate totalAmount using price * numOfPeople
    const totalAmount = dto.totalAmount ?? experience.price * numOfPeople;

    const booking = await this.prisma.booking.create({
      data: {
        userId,
        experienceId,
        numOfPeople,
        totalAmount,
        date: new Date(date),
        status: BookingStatus.PENDING,
        paymentId: dto.paymentId ?? null,
      },
    });

    return booking;
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
