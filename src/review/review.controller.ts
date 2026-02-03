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
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/createReview.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/RolesGuard';
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  //   create review
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('create')
  @Roles(Role.USER)
  async createReview(@Body() dto: CreateReviewDto, @Req() req) {
    const userId = req.user.id;
    return await this.reviewService.createReview(
      userId,
      dto.experienceId,
      dto.rating,
      dto.comment,
    );
  }

  // get reviews for an experience
  @Get('experience-reviews/:experienceId')
  async getExperienceReviews(@Param('experienceId') experienceId: string) {
    return await this.reviewService.getExperienceReviews(experienceId);
  }

  // delete review
    @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('delete/:reviewId')
  @Roles(Role.USER)
  async deleteReview(@Param('reviewId') reviewId: string, @Req() req) {
    const userId = req.user.id;
    return await this.reviewService.deleteReview(userId, reviewId);
  }

  // get all reviews
  @Get('all')
  async getAllReviews() {
    return await this.reviewService.getAllReviews();
  }
}
