import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CreateSubCategoryDto } from "./dto/create-subcategory.dto";
import { UpdateSubCategoryDto } from "./dto/update-subcategory.dto";

@Controller("categories")
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  // POST /categories
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  // GET /categories  (sidebar)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // GET /categories/:id
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  // PATCH /categories/:id
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  // DELETE /categories/:id
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  // ================= SUBCATEGORY =================

// POST /subcategories
@Post("subcategories")
createSub(@Body() dto: CreateSubCategoryDto) {
  return this.service.createSubCategory(dto);
}

// GET /subcategories/category/:categoryId
@Get("subcategories/category/:categoryId")
getByCategory(@Param("categoryId") id: string) {
  return this.service.findSubCategoriesByCategory(id);
}

// PATCH /subcategories/:id
@Patch("subcategories/:id")
updateSub(
  @Param("id") id: string,
  @Body() dto: UpdateSubCategoryDto,
) {
  return this.service.updateSubCategory(id, dto);
}

// DELETE /subcategories/:id
@Delete("subcategories/:id")
deleteSub(@Param("id") id: string) {
  return this.service.removeSubCategory(id);
}

}
