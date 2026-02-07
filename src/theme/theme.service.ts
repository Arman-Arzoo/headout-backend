import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTabDto } from './dto/create-tab.dto';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  // =============================
  // TAB METHODS
  // =============================

  createTab(dto: CreateTabDto) {
    return this.prisma.themeTab.create({
      data: dto,
    });
  }

  getAllTabs() {
    return this.prisma.themeTab.findMany({
      orderBy: { order: 'asc' },
      include: {
        themes: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  deleteTab(id: string) {
    return this.prisma.themeTab.delete({ where: { id } });
  }

  // =============================
  // THEME METHODS
  // =============================

  createTheme(dto: CreateThemeDto) {
    return this.prisma.theme.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        icon: dto.icon,
        order: dto.order ?? 0,
        tab: {
          connect: { id: dto.tabId },
        },
      },
    });
  }

  // ⭐ updated (explicit join table)
  getAllThemes() {
    return this.prisma.theme.findMany({
      include: {
        tab: true,
        experiences: {
          include: {
            experience: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async updateTheme(id: string, dto: UpdateThemeDto) {
    await this.ensureTheme(id);

    return this.prisma.theme.update({
      where: { id },
      data: dto,
    });
  }

  deleteTheme(id: string) {
    return this.prisma.theme.delete({ where: { id } });
  }

  // =============================
  // EXPERIENCE LINKING (NEW LOGIC)
  // =============================

  // ✅ attach
  attachThemeToExperience(themeId: string, experienceId: string) {
    return this.prisma.experienceTheme.create({
      data: {
        themeId,
        experienceId,
      },
    });
  }

  // ✅ detach
  detachThemeFromExperience(themeId: string, experienceId: string) {
    return this.prisma.experienceTheme.delete({
      where: {
        experienceId_themeId: {
          experienceId,
          themeId,
        },
      },
    });
  }

  // =============================
  // helpers
  // =============================

  private async ensureTheme(id: string) {
    const exists = await this.prisma.theme.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Theme not found');
  }
}
