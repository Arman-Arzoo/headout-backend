import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewService {
    constructor(private readonly prisma : PrismaService) { }

    // create review
    async createReview(userId: string, experienceId: string, rating: number, comment: string) {
        const review = await this.prisma.review.create({
            data: {
                userId,
                experienceId,
                rating,
                comment,
            },
        });
        return review;
    }

    // get reviews for an experience
    async getExperienceReviews(experienceId: string) {
        const reviews = await this.prisma.review.findMany({
            where: { experienceId },
            include: {
                user: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return reviews;
    }

    // delete review
    async deleteReview(userId: string, reviewId: string) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!review) {
            throw new Error('Review not found');
        }
        if (review.userId !== userId) {
            throw new Error('You can only delete your own reviews');
        }
        await this.prisma.review.delete({
            where: { id: reviewId },
        });
        return { message: 'Review deleted successfully' };
    }

    // get all reviews
    async getAllReviews() {
        return this.prisma.review.findMany({
            include: {
                user: true,
                experience: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }


// =====================================================
// GET REVIEW DISTRIBUTION FOR AN EXPERIENCE
// =====================================================

async getReviewDistribution(experienceId: string) {
  const [ratingGrouped, stats, countryGrouped] = await Promise.all([
    // ⭐ rating distribution
    this.prisma.review.groupBy({
      by: ['rating'],
      where: { experienceId },
      _count: { rating: true },
    }),

    // ⭐ total + average
    this.prisma.review.aggregate({
      where: { experienceId },
      _count: true,
      _avg: { rating: true },
    }),

    // ⭐ countries
    this.prisma.review.groupBy({
      by: ['country'],
      where: {
        experienceId,
        country: { not: null },
      },
      _count: { country: true },
      orderBy: {
        _count: { country: 'desc' },
      },
    }),
  ]);

  const total = stats._count;
  const average = Number((stats._avg.rating || 0).toFixed(1));

  // ---------- rating distribution ----------
  const ratingMap = new Map(
    ratingGrouped.map(r => [r.rating, r._count.rating])
  );

  const distribution = [5, 4, 3, 2, 1].map(stars => {
    const count = ratingMap.get(stars) || 0;

    return {
      stars,
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
    };
  });

  // ---------- countries ----------
  const highlightedCountries = countryGrouped
    .slice(0, 3)
    .map(c => c.country);

  const totalCountries = countryGrouped.length;

  // ---------- final response ----------
  return {
    average,
    total,
    distribution,
    highlightedCountries,
    totalCountries,
  };
}


    
}
