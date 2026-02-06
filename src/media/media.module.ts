import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';

import { PrismaService } from '../prisma/prisma.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { S3Service } from './s3.service';
import { MediaResolverService } from './mediaResolver.service';

@Module({
  imports: [
    MulterModule.register({
      storage: multer.memoryStorage(), // ✅ REQUIRED for file.buffer
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, PrismaService, S3Service, MediaResolverService],
   exports: [MediaResolverService, S3Service],
})
export class MediaModule {}
