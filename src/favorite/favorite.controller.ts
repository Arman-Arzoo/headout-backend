import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { FavoriteService } from './favorite.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/RolesGuard';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  // Add experience to favorites
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('add')
  @Roles(Role.USER)
  async addToFavorites(@Body('experienceId') experienceId: string, @Req() req) {
    return this.favoriteService.addToFavorites(req.user.id, experienceId);
  }

  // Remove experience from favorites
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('remove/:experienceId')
  @Roles(Role.USER)
  async removeFromFavorites(
    @Param('experienceId') experienceId: string,
    @Req() req,
  ) {
    return this.favoriteService.removeFromFavorites(req.user.id, experienceId);
  }

  // get all favorite experiences for a user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('list')
  @Roles(Role.USER)
  async getUserFavorites(@Req() req) {
    return this.favoriteService.getUserFavorites(req.user.id);
  }
}
