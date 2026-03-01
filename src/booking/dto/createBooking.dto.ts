import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  experienceId: string;

  @IsString()
  pricingId: string;

  @IsNumber()
  @Min(1)
  participants: number;

  @IsDateString()
  date: string; // ISO date

  // For HOURLY bookings
  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;
}