import { Module } from '@nestjs/common';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ExperienceController],
  providers: [ExperienceService, PrismaService]
})
export class ExperienceModule {}
