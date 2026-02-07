import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { ThemeService } from './theme.service';
import { CreateTabDto } from './dto/create-tab.dto';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';


@Controller('themes')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  // =============================
  // TAB ROUTES
  // =============================

  @Post('tabs')
  createTab(@Body() dto: CreateTabDto) {
    return this.themeService.createTab(dto);
  }

  @Get('tabs')
  getTabs() {
    return this.themeService.getAllTabs();
  }

  @Delete('tabs/:id')
  deleteTab(@Param('id') id: string) {
    return this.themeService.deleteTab(id);
  }

  // =============================
  // THEME ROUTES
  // =============================

  @Post()
  create(@Body() dto: CreateThemeDto) {
    return this.themeService.createTheme(dto);
  }

  @Get()
  findAll() {
    return this.themeService.getAllThemes();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateThemeDto) {
    return this.themeService.updateTheme(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.themeService.deleteTheme(id);
  }

  // =============================
  // LINK EXPERIENCE
  // =============================

  @Post(':themeId/experience/:experienceId')
  attach(
    @Param('themeId') themeId: string,
    @Param('experienceId') experienceId: string,
  ) {
    return this.themeService.attachThemeToExperience(themeId, experienceId);
  }
}
