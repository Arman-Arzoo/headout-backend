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

    
}
