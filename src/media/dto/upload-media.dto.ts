import { IsString, IsOptional } from 'class-validator';

export class UploadMediaDto {
  @IsString()
  url: string;

  @IsString()
  type: string; // image, video, file

  @IsOptional()
  @IsString()
  userId?: string;
}
