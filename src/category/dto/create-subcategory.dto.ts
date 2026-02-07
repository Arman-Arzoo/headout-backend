import { IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class CreateSubCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;
}
