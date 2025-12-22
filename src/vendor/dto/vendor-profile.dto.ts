import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateVendorProfileDto {
 
  @IsString()
  businessName: string;
  @IsString()
  @IsOptional()
  description?: string;
  @IsString()
  @IsOptional()
  phone?: string;
  @IsString()
  @IsOptional()
  address?: string;
  @IsBoolean()
  @IsOptional()
  verified?: boolean;
}

