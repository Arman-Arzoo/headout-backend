import {
  ExperienceStatus,
  FeatureType,
  InfoSection,
  PricingType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsDateString,
} from 'class-validator';

//
// CHILD DTOs
//

export class HighlightDto {
  @IsString()
  icon!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class FeatureDto {
  @IsString()
  text!: string;

  @IsEnum(FeatureType)
  type!: FeatureType;

  @IsOptional()
  @IsBoolean()
  optional?: boolean;
}

export class SectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  content!: string;
}

export class OperatingHourDto {
  @IsInt()
  @Min(0)
  dayOfWeek!: number;

  @IsString()
  openTime!: string;

  @IsString()
  closeTime!: string;
}

export class InfoDto {
  @IsEnum(InfoSection)
  section!: InfoSection;

  @IsString()
  text!: string;
}

export class TicketInfoDto {
  @IsString()
  instruction!: string;

  @IsOptional()
  @IsString()
  address?: string;
}

//
// TICKET TYPES
//

export class CreateExperienceTicketTypeDto {
  @IsString()
  code!: string; // ADULT, CHILD, SENIOR

  @IsString()
  label!: string; // Adult, Child, Senior

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minAge?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxAge?: number;

  @IsNumber()
  basePrice!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  pricingId?: string;
}

//
// PRICING
//

export class CreatePricingSlotDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}

export class CreatePricingDto {
  @IsEnum(PricingType)
  type!: PricingType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minParticipants?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
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

  // keep this only if you still want JSON fallback pricing
  @IsOptional()
  @IsObject()
  categoryPrices?: Record<string, number>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePricingSlotDto)
  slots?: CreatePricingSlotDto[];
}

//
// MAIN DTO
//

export class CreateExperienceDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  location!: string;

  @IsString()
  city!: string;

  @IsString()
  country!: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsEnum(ExperienceStatus)
  status?: ExperienceStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePricingDto)
  pricings!: CreatePricingDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExperienceTicketTypeDto)
  ticketTypes?: CreateExperienceTicketTypeDto[];

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  themeIds?: string[];

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HighlightDto)
  highlights?: HighlightDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  experienceBullets?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  features?: FeatureDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections?: SectionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHourDto)
  operatingHours?: OperatingHourDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InfoDto)
  infos?: InfoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketInfoDto)
  ticketInfos?: TicketInfoDto[];
}