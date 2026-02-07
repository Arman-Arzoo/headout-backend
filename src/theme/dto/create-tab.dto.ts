import { IsOptional, IsString } from 'class-validator';

export class CreateTabDto {
  @IsString()
  name: string;

  @IsOptional()
  order?: number;
}
