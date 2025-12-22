import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

import { BookingStatus, Role } from '@prisma/client';
import { CreateBookingDto } from './dto/createBooking.dto';
import { RolesGuard } from 'src/auth/RolesGuard';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // ────────────────────────────────────────────────
  // CREATE BOOKING
  // ────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Post('create')
  async createBooking(@Body() dto: CreateBookingDto, @Req() req) {
    const userId = req.user.id;

    return this.bookingService.createBooking(dto, userId);
  }

  // ────────────────────────────────────────────────
  // GET USER BOOKINGS
  // ────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('user-bookings')
  async getUserBookings(@Req() req) {
    const userId = req.user.id;
    return this.bookingService.getUserBookings(userId);
  }

  // ────────────────────────────────────────────────
  // GET VENDOR BOOKINGS
  // (Vendor must have vendorProfile)
  // ────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('vendor-bookings')
  async getVendorBookings(@Req() req) {
    const userId = req.user.id;
    return this.bookingService.getVendorBookings(userId);
  }

  // ────────────────────────────────────────────────
  // UPDATE BOOKING STATUS
  // ────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Patch('update-status/:id')
  async updateBookingStatus(
    @Param('id') bookingId: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingService.updateBookingStatus(bookingId, status);
  }

  // ────────────────────────────────────────────────
  // CANCEL BOOKING
  // ────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Patch('cancel/:id')
  async cancelBooking(@Param('id') bookingId: string) {
    return this.bookingService.cancelBooking(bookingId);
  }
}
