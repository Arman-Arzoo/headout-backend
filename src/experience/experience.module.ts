import { Module } from '@nestjs/common';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MediaResolverService } from 'src/media/mediaResolver.service';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports:[MediaModule],
  controllers: [ExperienceController],
  providers: [ExperienceService, PrismaService,MediaResolverService ]
})
export class ExperienceModule {}
