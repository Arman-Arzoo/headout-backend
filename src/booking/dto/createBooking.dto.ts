import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class CreateBookingDto {


  @IsString()
  experienceId: string;

  @IsDateString()
  date: string; // ISO date format

  @IsNumber()
  @Min(1)
  numOfPeople: number;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsString()
  @IsOptional()
  paymentId?: string;
}
