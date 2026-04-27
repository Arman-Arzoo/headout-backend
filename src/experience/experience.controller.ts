import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { CreateExperienceDto } from './experience.dto';
import { RolesGuard } from 'src/auth/RolesGuard';
import { AuthenticatedRequest } from 'src/auth/authenticated-request';

import { Role } from '@prisma/client';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

@Controller('experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Post('create')
  async createExperience(
    @Body() dto: CreateExperienceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;

    return this.experienceService.createExperience(dto, userId);
  }

  @Get()
  async getAllExperiences() {
    return this.experienceService.getAllExperiences();
  }
  @Get('/:slug')
  async getExperienceBySlug(@Param('slug') slug: string) {
    return this.experienceService.getExperienceBySlug(slug);
  }

   @Get('get/:id')
  async getExperienceById(@Param('id') id: string) {
    return this.experienceService.getExperienceById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update/:id')
  async updateExperience(
    @Param('id') id: string,
    @Body() dto: Partial<CreateExperienceDto>,
  ) {
    return this.experienceService.updateExperience(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteExperience(@Param('id') id: string) {
    return this.experienceService.deleteExperience(id);
  }

  @Get(':id/availability')
  getAvailability(
    @Param('id') id: string,
    @Query('date') date: string,
    @Query('participants') participants?: string,
  ) {
    return this.experienceService.getAvailableOptions(
      id,
      date,
      Number(participants) || 1,
    );
  }
}
