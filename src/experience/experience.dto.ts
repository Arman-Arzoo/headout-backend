
import { Category } from '@prisma/client';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';


export class CreateExperienceDto {
  @IsString()
  title: string;
  @IsString()
  slug: string;
  @IsString()
  description: string;
  @IsString()
  location: string;
  @IsString()
  city: string;
  @IsString()
  country: string;
  @IsString()
  category: Category;
  @IsNumber()
  price: number;
  @IsString()
  duration?: string;
  @IsOptional()
  images?: string[];
  @IsBoolean()
  available?: boolean;

}
