import { IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;
}
