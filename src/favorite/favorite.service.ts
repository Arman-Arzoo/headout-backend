import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FavoriteService {
    constructor(private readonly prisma:PrismaService){}

    // Add experience to favorites
    async addToFavorites(userId: string, experienceId: string) {    
        return this.prisma.favorite.create({
            data: {
                userId,
                experienceId,
            },
        });
    }

    // Remove experience from favorites
    async removeFromFavorites(userId: string, experienceId: string) {
        return this.prisma.favorite.deleteMany({
            where: {
                userId,
                experienceId,
            },
        });
    }

    // get all favorite experiences for a user
    async getUserFavorites(userId: string) {
        return this.prisma.favorite.findMany({
            where: {
                userId,
            },
            include: {
                experience: true,
            },
        });
    }
}
