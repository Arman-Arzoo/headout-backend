import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReservationTicketDto {
  @IsString()
  @IsNotEmpty()
  ticketType: string; // e.g. ADULT, CHILD, SENIOR

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  experienceId: string;

  @IsString()
  @IsNotEmpty()
  pricingId: string;

  @IsString()
  @IsNotEmpty()
  date: string; // ISO string (YYYY-MM-DD or full ISO)

  @IsString()
  @IsOptional()
  startTime?: string; // "08:45", "10:00"

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationTicketDto)
  tickets: ReservationTicketDto[];
}