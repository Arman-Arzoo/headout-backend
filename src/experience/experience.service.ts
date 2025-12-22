import { BadGatewayException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExperienceDto } from './experience.dto';

@Injectable()
export class ExperienceService {
  constructor(private readonly prisma: PrismaService) {}


  async createExperience(dto: CreateExperienceDto, userId: string) {
    console.log

     const vendor = await this.prisma.vendorProfile.findUnique({
    where: { userId },
  });

  
  // if (!vendor) {
  //   throw new BadGatewayException('Vendor profile does not exist for this user');

  // }
    const experience = await this.prisma.experience.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        location: dto.location,
        city: dto.city,
        country: dto.country,
        category: dto.category,
        price: dto.price,
        duration: dto.duration,
        images: dto.images,
        available: dto.available,
        vendorId: vendor?.id ? vendor?.id : null, // associate experience with vendor profile
      },
    });

    console.log('Created experience:', experience);

    return experience;
  }
  async getAllExperiences() {
    const experiences = await this.prisma.experience.findMany();
    return experiences;
  }
  async getExperienceBySlug(slug: string) {
    const experience = await this.prisma.experience.findUnique({
      where: {
        slug: slug, // to be replaced with actual slug
      },
    });
    return experience;
  }

  async updateExperience(id: string, dto: CreateExperienceDto) {
    const experience = await this.prisma.experience.update({
      where: {
        id: id, 
      },
      data: dto,
    });
    return experience;
  }

  async deleteExperience(id: string) {
    const experience = await this.prisma.experience.delete({
      where: {
        id: id, // to be replaced with actual id
      },
    });
    return experience;
  }
}
