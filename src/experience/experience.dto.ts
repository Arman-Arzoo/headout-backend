import { FeatureType, InfoSection, PricingType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import e from 'express';

//
// ======================================================
// CHILD DTOs
// ======================================================
//

// ---------- Highlight ----------
export class HighlightDto {
  @IsString()
  icon: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// ---------- Inclusion / Exclusion ----------
export class FeatureDto {
  @IsString()
  text: string;

  @IsEnum(FeatureType)
  type: FeatureType;

  @IsOptional()
  @IsBoolean()
  optional?: boolean;
}

// ---------- Description Sections ----------
export class SectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  content: string;
}

// ---------- Operating Hours ----------
export class OperatingHourDto {
  @IsInt()
  dayOfWeek: number;

  @IsString()
  openTime: string;

  @IsString()
  closeTime: string;
}

// ---------- Know Before You Go ----------
export class InfoDto {
  @IsEnum(InfoSection)
  section: InfoSection;

  @IsString()
  text: string;
}

// ---------- Ticket Info ----------
export class TicketInfoDto {
  @IsString()
  instruction: string;

  @IsOptional()
  @IsString()
  address?: string;
}

// ---------- Pricing ----------
export class CreatePricingDto {
  @IsEnum(PricingType)
  type: PricingType;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  minParticipants?: number;

  @IsOptional()
  @IsInt()
  maxParticipants?: number;

  @IsOptional()
  @IsInt()
  maxPeople?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;


  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @ValidateNested({ each: true })
  @Type(() => CreatePricingSlotDto)
  slots?: CreatePricingSlotDto[];
}

export class CreatePricingSlotDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsInt()
  capacity?: number;
}

//
// ======================================================
// MAIN CREATE EXPERIENCE DTO (UPDATED)
// ======================================================
//

export class CreateExperienceDto {
  // ---------------- Basic ----------------

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  location: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  // @IsNumber()
  // price: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ValidateNested({ each: true })
  @Type(() => CreatePricingDto)
  pricings: CreatePricingDto[];

  // ---------------- Relations (NEW ⭐) ----------------

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  subCategoryId?: string;

  // ✅ themes (many-to-many)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  themeIds?: string[];

  // ---------------- Map ----------------

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  address?: string;

  // ---------------- Cancellation ----------------

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  // ---------------- Highlights ----------------

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HighlightDto)
  highlights?: HighlightDto[];

  // ---------------- Bullets ----------------

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  experienceBullets?: string[];

  // ---------------- Features ----------------

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  features?: FeatureDto[];

  // ---------------- Sections ----------------

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections?: SectionDto[];

  // ---------------- Operating Hours ----------------

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OperatingHourDto)
  operatingHours?: OperatingHourDto[];

  // ---------------- Infos ----------------

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InfoDto)
  infos?: InfoDto[];

  // ---------------- Ticket Infos ----------------

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TicketInfoDto)
  ticketInfos?: TicketInfoDto[];
}
