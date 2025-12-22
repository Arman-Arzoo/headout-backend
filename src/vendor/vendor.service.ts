import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVendorProfileDto } from './dto/vendor-profile.dto';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  //   create
  async create(userId: string, dto: CreateVendorProfileDto) {
    const vendor = await this.prisma.vendorProfile.create({
      data: {
        userId: userId,
        businessName: dto.businessName,
        description: dto.description,
        phone: dto.phone,
        address: dto.address,
        verified: dto.verified,
      },
    });
    return vendor;
  }

  //   get by id
  async findById(id: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: {
        id: id,
      },
    });
    return vendor;
  }

  //   get all
  async findAll() {
    const vendors = await this.prisma.vendorProfile.findMany();
    return vendors;
  }

  //   update
  async update(id: string, dto: Partial<CreateVendorProfileDto>) {
    const vendor = await this.prisma.vendorProfile.update({
      where: {
        id: id,
      },
      data: dto,
    });
    return vendor;
  }

  //   delete
  async delete(id: string) {
    const vendor = await this.prisma.vendorProfile.delete({
      where: {
        id: id,
      },
    });
    return vendor;
  }
}
