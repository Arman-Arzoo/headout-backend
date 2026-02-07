import { IsString, IsOptional, IsNumber } from "class-validator";

export class CreateThemeDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsString()
  tabId: string;
}
