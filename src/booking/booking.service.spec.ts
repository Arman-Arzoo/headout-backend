import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('BookingService', () => {
  let service: BookingService;
  let prisma: {
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject createBooking with invalid date', async () => {
    await expect(
      service.createBooking(
        {
          experienceId: 'exp-1',
          pricingId: 'price-1',
          participants: 2,
          date: 'invalid-date',
        },
        'user-1',
      ),
    ).rejects.toThrow(new BadRequestException('Invalid booking date'));
  });

  it('should reject createReservation with invalid date', async () => {
    await expect(
      service.createReservation({
        experienceId: 'exp-1',
        pricingId: 'price-1',
        date: 'bad-date',
        tickets: [{ ticketType: 'ADULT', quantity: 1 }],
      }),
    ).rejects.toThrow(new BadRequestException('Invalid booking date'));
  });

  it('should require startTime for HOURLY createBooking', async () => {
    const tx = {
      experience: {
        findFirst: jest.fn().mockResolvedValue({ id: 'exp-1' }),
      },
      experiencePricing: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'price-1',
          type: 'HOURLY',
          active: true,
          validFrom: null,
          validTo: null,
          minParticipants: null,
          maxParticipants: null,
          maxPeople: null,
          basePrice: 100,
          currency: 'USD',
          slots: [],
        }),
      },
    };

    prisma.$transaction.mockImplementation(
      (cb: (ctx: unknown) => Promise<unknown>): Promise<unknown> =>
        cb(tx as unknown),
    );

    await expect(
      service.createBooking(
        {
          experienceId: 'exp-1',
          pricingId: 'price-1',
          participants: 2,
          date: '2026-04-30',
        },
        'user-1',
      ),
    ).rejects.toThrow(
      new BadRequestException('startTime is required for hourly bookings'),
    );
  });

  it('should include active reservations in capacity check', async () => {
    const date = '2026-04-30';
    const dayOfWeek = new Date(date).getDay();
    const tx = {
      experience: {
        findFirst: jest.fn().mockResolvedValue({ id: 'exp-1' }),
      },
      experiencePricing: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'price-1',
          type: 'HOURLY',
          active: true,
          validFrom: null,
          validTo: null,
          minParticipants: null,
          maxParticipants: null,
          maxPeople: null,
          basePrice: 100,
          currency: 'USD',
          slots: [
            {
              id: 'slot-1',
              date: null,
              dayOfWeek,
              startTime: '10:00',
              endTime: '11:00',
              price: 100,
              capacity: 10,
            },
          ],
        }),
      },
      experienceAvailability: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      reservation: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { seats: 8 },
        }),
      },
      booking: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { participants: 3 },
        }),
      },
    };

    prisma.$transaction.mockImplementation(
      (cb: (ctx: unknown) => Promise<unknown>): Promise<unknown> =>
        cb(tx as unknown),
    );

    await expect(
      service.createBooking(
        {
          experienceId: 'exp-1',
          pricingId: 'price-1',
          participants: 1,
          date,
          startTime: '10:00',
        },
        'user-1',
      ),
    ).rejects.toThrow(new BadRequestException('Not enough capacity available'));
  });
});
