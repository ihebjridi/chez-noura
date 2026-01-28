import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DailyMenuDto,
  DailyMenuWithDetailsDto,
  DailyMenuPackDto,
  DailyMenuVariantDto,
  CreateDailyMenuDto,
  AddPackToDailyMenuDto,
  AddVariantToDailyMenuDto,
  PublishDailyMenuResponseDto
} from '@contracts/core';

@Injectable()
export class DailyMenusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateDailyMenuDto): Promise<DailyMenuDto> {
    // Parse date string (YYYY-MM-DD) as local date, not UTC
    // This prevents timezone issues where "2024-01-26" becomes "2024-01-25"
    const [year, month, day] = createDto.date.split('-').map(Number);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);

    // Check if menu already exists for this date
    const existing = await this.prisma.dailyMenu.findUnique({
      where: { date },
    });

    if (existing) {
      throw new BadRequestException(`Daily menu already exists for date ${createDto.date}`);
    }

    // Default cutoff hour to "14:00" if not provided
    const cutoffHour = createDto.cutoffHour || '14:00';

    const menu = await this.prisma.dailyMenu.create({
        data: {
          date,
          status: 'DRAFT' as any,
          cutoffHour,
        },
    });

    return this.mapToDto(menu);
  }

  async findAll(): Promise<DailyMenuDto[]> {
    const menus = await this.prisma.dailyMenu.findMany({
      orderBy: { date: 'desc' },
    });

    return menus.map((menu) => this.mapToDto(menu));
  }

  async findOne(id: string): Promise<DailyMenuWithDetailsDto> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
      include: {
        packs: {
          include: {
            pack: true,
          },
        },
        variants: {
          include: {
            variant: {
              include: {
                component: true,
              },
            },
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    return this.mapToDtoWithDetails(menu);
  }

  async findByDate(date: string): Promise<DailyMenuWithDetailsDto | null> {
    // Parse date string (YYYY-MM-DD) as local date, not UTC
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);

    const menu = await this.prisma.dailyMenu.findUnique({
      where: { date: dateObj },
      include: {
        packs: {
          include: {
            pack: true,
          },
        },
        variants: {
          include: {
            variant: {
              include: {
                component: true,
              },
            },
          },
        },
      },
    });

    if (!menu) {
      return null;
    }

    return this.mapToDtoWithDetails(menu);
  }

  async addPack(id: string, addPackDto: AddPackToDailyMenuDto): Promise<DailyMenuPackDto> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    // Check if pack exists
    const pack = await this.prisma.pack.findUnique({
      where: { id: addPackDto.packId },
    });

    if (!pack) {
      throw new NotFoundException(`Pack with ID ${addPackDto.packId} not found`);
    }

    // Check if pack is already added
    const existing = await this.prisma.dailyMenuPack.findUnique({
      where: {
        dailyMenuId_packId: {
          dailyMenuId: id,
          packId: addPackDto.packId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Pack is already added to this daily menu');
    }

    const dailyMenuPack = await this.prisma.dailyMenuPack.create({
      data: {
        dailyMenuId: id,
        packId: addPackDto.packId,
      },
      include: {
        pack: true,
      },
    });

    return this.mapPackToDto(dailyMenuPack);
  }

  async addVariant(
    id: string,
    addVariantDto: AddVariantToDailyMenuDto,
  ): Promise<DailyMenuVariantDto> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    // Check if variant exists
    const variant = await this.prisma.variant.findUnique({
      where: { id: addVariantDto.variantId },
      include: {
        component: true,
      },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${addVariantDto.variantId} not found`);
    }

    // Check if variant is already added
    const existing = await this.prisma.dailyMenuVariant.findUnique({
      where: {
        dailyMenuId_variantId: {
          dailyMenuId: id,
          variantId: addVariantDto.variantId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Variant is already added to this daily menu');
    }

    const dailyMenuVariant = await this.prisma.dailyMenuVariant.create({
      data: {
        dailyMenuId: id,
        variantId: addVariantDto.variantId,
        initialStock: addVariantDto.initialStock ?? 50,
      },
      include: {
        variant: {
          include: {
            component: true,
          },
        },
      },
    });

    return this.mapVariantToDto(dailyMenuVariant);
  }

  async removeVariant(id: string, variantId: string): Promise<void> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    // Only allow removal from DRAFT menus
    if (menu.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot remove variant from menu with status ${menu.status}. Only DRAFT menus allow variant removal.`,
      );
    }

    // Check if variant exists in the menu
    const dailyMenuVariant = await this.prisma.dailyMenuVariant.findUnique({
      where: {
        dailyMenuId_variantId: {
          dailyMenuId: id,
          variantId: variantId,
        },
      },
    });

    if (!dailyMenuVariant) {
      throw new NotFoundException(
        `Variant with ID ${variantId} is not associated with this daily menu`,
      );
    }

    // Delete the variant from the menu
    await this.prisma.dailyMenuVariant.delete({
      where: {
        dailyMenuId_variantId: {
          dailyMenuId: id,
          variantId: variantId,
        },
      },
    });
  }

  async publish(id: string): Promise<PublishDailyMenuResponseDto> {
    return await this.prisma.$transaction(async (tx) => {
      const menu = await tx.dailyMenu.findUnique({
        where: { id },
        include: {
          packs: {
            include: {
              pack: {
                include: {
                  packComponents: {
                    include: {
                      component: true,
                    },
                  },
                },
              },
            },
          },
          variants: {
            include: {
              variant: {
                include: {
                  component: true,
                },
              },
            },
          },
        },
      });

      if (!menu) {
        throw new NotFoundException(`Daily menu with ID ${id} not found`);
      }

      if (menu.status !== 'DRAFT') {
        throw new BadRequestException(
          `Cannot publish menu with status ${menu.status}. Only DRAFT menus can be published.`,
        );
      }

      const warnings: string[] = [];

      // Check guardrails
      for (const dailyMenuPack of menu.packs) {
        const pack = dailyMenuPack.pack;

        // Check if pack has all required components
        const requiredComponents = pack.packComponents.filter((pc) => pc.required);
        const menuVariantComponentIds = new Set(
          menu.variants.map((v) => v.variant.componentId),
        );

        for (const requiredComponent of requiredComponents) {
          if (!menuVariantComponentIds.has(requiredComponent.componentId)) {
            warnings.push(
              `Pack "${pack.name}" is missing required component "${requiredComponent.component.name}"`,
            );
          }
        }

        // Check if components have at least 2 variants
        const componentVariantCounts = new Map<string, number>();
        for (const variant of menu.variants) {
          const count = componentVariantCounts.get(variant.variant.componentId) || 0;
          componentVariantCounts.set(variant.variant.componentId, count + 1);
        }

        for (const packComponent of pack.packComponents) {
          const variantCount = componentVariantCounts.get(packComponent.componentId) || 0;
          if (variantCount === 1) {
            warnings.push(
              `Component "${packComponent.component.name}" in pack "${pack.name}" has only 1 variant available`,
            );
          }
        }
      }

      // Check total stock vs yesterday's usage
      const yesterday = new Date(menu.date);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const yesterdayMenu = await tx.dailyMenu.findUnique({
        where: { date: yesterday },
        include: {
          variants: true,
          orders: {
            where: {
              status: 'LOCKED',
            },
            include: {
              items: true,
            },
          },
        },
      });

      if (yesterdayMenu) {
        // Calculate yesterday's usage per variant
        const yesterdayUsage = new Map<string, number>();
        for (const order of yesterdayMenu.orders) {
          for (const item of order.items) {
            const usage = yesterdayUsage.get(item.variantId) || 0;
            yesterdayUsage.set(item.variantId, usage + 1);
          }
        }

        // Compare with today's stock
        for (const variant of menu.variants) {
          const yesterdayVariantUsage = yesterdayUsage.get(variant.variantId) || 0;
          if (variant.initialStock < yesterdayVariantUsage) {
            warnings.push(
              `Variant "${variant.variant.name}" has stock ${variant.initialStock} which is less than yesterday's usage of ${yesterdayVariantUsage}`,
            );
          }
        }
      }

      // Publish the menu
      await tx.dailyMenu.update({
        where: { id },
        data: {
          status: 'PUBLISHED' as any,
          publishedAt: new Date(),
        },
      });

      return {
        success: true,
        warnings,
      };
    });
  }

  async lock(id: string): Promise<DailyMenuDto> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    if (menu.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Cannot lock menu with status ${menu.status}. Only PUBLISHED menus can be locked.`,
      );
    }

    const updated = await this.prisma.dailyMenu.update({
      where: { id },
      data: {
        status: 'LOCKED' as any,
      },
    });

    return this.mapToDto(updated);
  }

  async unlock(id: string): Promise<DailyMenuDto> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    if (menu.status !== 'LOCKED') {
      throw new BadRequestException(
        `Cannot unlock menu with status ${menu.status}. Only LOCKED menus can be unlocked.`,
      );
    }

    const updated = await this.prisma.dailyMenu.update({
      where: { id },
      data: {
        status: 'PUBLISHED' as any,
      },
    });

    return this.mapToDto(updated);
  }

  async updateCutoffHour(id: string, cutoffHour: string): Promise<DailyMenuDto> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    // Only allow updates for DRAFT and PUBLISHED menus (not LOCKED)
    if (menu.status === 'LOCKED') {
      throw new BadRequestException(
        `Cannot update cutoff hour for menu with status ${menu.status}. Only DRAFT and PUBLISHED menus can have their cutoff hour updated.`,
      );
    }

    // Validate format (should already be validated by DTO, but double-check)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(cutoffHour)) {
      throw new BadRequestException('cutoffHour must be in HH:MM format (24-hour)');
    }

    const updated = await this.prisma.dailyMenu.update({
      where: { id },
      data: {
        cutoffHour,
      },
    });

    return this.mapToDto(updated);
  }

  async delete(id: string): Promise<void> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    // Only allow deletion of DRAFT menus
    if (menu.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot delete menu with status ${menu.status}. Only DRAFT menus can be deleted.`,
      );
    }

    await this.prisma.dailyMenu.delete({
      where: { id },
    });
  }

  private mapToDto(menu: any): DailyMenuDto {
    // Format date as YYYY-MM-DD in local timezone, not UTC
    // This ensures the date matches what was originally sent (e.g., "2024-01-26" stays "2024-01-26")
    const date = menu.date instanceof Date ? menu.date : new Date(menu.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return {
      id: menu.id,
      date: dateString,
      status: menu.status as any,
      cutoffHour: menu.cutoffHour || undefined,
      publishedAt: menu.publishedAt ? menu.publishedAt.toISOString() : undefined,
      createdAt: menu.createdAt.toISOString(),
      updatedAt: menu.updatedAt.toISOString(),
    };
  }

  private mapToDtoWithDetails(menu: any): DailyMenuWithDetailsDto {
    return {
      ...this.mapToDto(menu),
      packs: menu.packs.map((p: any) => this.mapPackToDto(p)),
      variants: menu.variants.map((v: any) => this.mapVariantToDto(v)),
    };
  }

  private mapPackToDto(dailyMenuPack: any): DailyMenuPackDto {
    return {
      id: dailyMenuPack.id,
      dailyMenuId: dailyMenuPack.dailyMenuId,
      packId: dailyMenuPack.packId,
      packName: dailyMenuPack.pack.name,
      packPrice: Number(dailyMenuPack.pack.price),
      createdAt: dailyMenuPack.createdAt.toISOString(),
      updatedAt: dailyMenuPack.updatedAt.toISOString(),
    };
  }

  private mapVariantToDto(dailyMenuVariant: any): DailyMenuVariantDto {
    return {
      id: dailyMenuVariant.id,
      dailyMenuId: dailyMenuVariant.dailyMenuId,
      variantId: dailyMenuVariant.variantId,
      variantName: dailyMenuVariant.variant.name,
      componentId: dailyMenuVariant.variant.componentId,
      componentName: dailyMenuVariant.variant.component.name,
      initialStock: dailyMenuVariant.initialStock,
      createdAt: dailyMenuVariant.createdAt.toISOString(),
      updatedAt: dailyMenuVariant.updatedAt.toISOString(),
    };
  }
}
