import { Category, FeatureType, InfoSection } from '@prisma/client';
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
} from 'class-validator';
import { Type } from 'class-transformer';

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
  dayOfWeek: number; // 0–6

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

//
// ======================================================
// MAIN CREATE EXPERIENCE DTO
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

  @IsEnum(Category)
  category: Category;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  available?: boolean;

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

  // -------------- ExperienceBullets ----------------
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
