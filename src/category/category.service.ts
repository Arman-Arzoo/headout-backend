import { Injectable, NotFoundException } from "@nestjs/common";

import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { UpdateSubCategoryDto } from "./dto/update-subcategory.dto";
import { CreateSubCategoryDto } from "./dto/create-subcategory.dto";

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  // ✅ create
  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: dto,
    });
  }

  // ✅ sidebar use (with subcategories)
  findAll() {
    return this.prisma.category.findMany({
      include: {
        subCategories: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
  }

  // ✅ single
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { subCategories: true },
    });

    if (!category) throw new NotFoundException("Category not found");

    return category;
  }

  // ✅ update
  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  // ✅ delete
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.category.delete({
      where: { id },
    });
  }


  // ======================================================
// SUBCATEGORY METHODS
// ======================================================

// ✅ create
createSubCategory(dto: CreateSubCategoryDto) {
  return this.prisma.subCategory.create({
    data: {
      name: dto.name,
      slug: dto.slug,
      order: dto.order ?? 0,
      category: {
        connect: { id: dto.categoryId },
      },
    },
  });
}

// ✅ get by category (sidebar usage)
findSubCategoriesByCategory(categoryId: string) {
  return this.prisma.subCategory.findMany({
    where: { categoryId },
    orderBy: { order: "asc" },
  });
}

// ✅ single
async findSubCategory(id: string) {
  const sub = await this.prisma.subCategory.findUnique({
    where: { id },
  });

  if (!sub) throw new NotFoundException("SubCategory not found");

  return sub;
}

// ✅ update
async updateSubCategory(id: string, dto: UpdateSubCategoryDto) {
  await this.findSubCategory(id);

  return this.prisma.subCategory.update({
    where: { id },
    data: {
      name: dto.name,
      slug: dto.slug,
      order: dto.order,
      ...(dto.categoryId && {
        category: { connect: { id: dto.categoryId } },
      }),
    },
  });
}

// ✅ delete
async removeSubCategory(id: string) {
  await this.findSubCategory(id);

  return this.prisma.subCategory.delete({
    where: { id },
  });
}

}
