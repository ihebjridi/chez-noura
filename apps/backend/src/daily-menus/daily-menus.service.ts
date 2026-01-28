import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DailyMenuDto,
  DailyMenuWithDetailsDto,
  DailyMenuPackDto,
  DailyMenuVariantDto,
  DailyMenuServiceDto,
  DailyMenuServiceVariantDto,
  CreateDailyMenuDto,
  AddPackToDailyMenuDto,
  AddVariantToDailyMenuDto,
  AddServiceToDailyMenuDto,
  AddVariantToDailyMenuServiceDto,
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
        services: {
          include: {
            service: true,
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
        services: {
          include: {
            service: {
              include: {
                servicePacks: {
                  include: {
                    pack: true,
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

  /**
   * Add a service to a daily menu
   * Automatically adds all packs from the service to the menu
   */
  async addService(id: string, addServiceDto: AddServiceToDailyMenuDto): Promise<DailyMenuServiceDto> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    // Check if service exists and is published
    const service = await this.prisma.service.findUnique({
      where: { id: addServiceDto.serviceId },
      include: {
        servicePacks: {
          include: {
            pack: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${addServiceDto.serviceId} not found`);
    }

    if (!service.isPublished) {
      throw new BadRequestException('Service is not published and cannot be added to a menu');
    }

    if (!service.isActive) {
      throw new BadRequestException('Service is not active and cannot be added to a menu');
    }

    // Check if service is already added
    const existing = await this.prisma.dailyMenuService.findUnique({
      where: {
        dailyMenuId_serviceId: {
          dailyMenuId: id,
          serviceId: addServiceDto.serviceId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Service is already added to this daily menu');
    }

    // Create DailyMenuService and automatically add all packs
    const result = await this.prisma.$transaction(async (tx) => {
      const dailyMenuService = await tx.dailyMenuService.create({
        data: {
          dailyMenuId: id,
          serviceId: addServiceDto.serviceId,
        },
      });

      // Automatically add all packs from the service
      const dailyMenuPacks = await Promise.all(
        service.servicePacks.map((servicePack) =>
          tx.dailyMenuPack.upsert({
            where: {
              dailyMenuId_packId: {
                dailyMenuId: id,
                packId: servicePack.packId,
              },
            },
            create: {
              dailyMenuId: id,
              packId: servicePack.packId,
            },
            update: {},
          }),
        ),
      );

      return { dailyMenuService, dailyMenuPacks };
    });

    // Fetch the created service with packs and variants
    const created = await this.prisma.dailyMenuService.findUnique({
      where: { id: result.dailyMenuService.id },
      include: {
        service: true,
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

    // Get packs for this service in the menu
    const servicePackIds = service.servicePacks.map((sp) => sp.packId);
    const menuPacks = await this.prisma.dailyMenuPack.findMany({
      where: {
        dailyMenuId: id,
        packId: { in: servicePackIds },
      },
      include: {
        pack: true,
      },
    });

    return this.mapDailyMenuServiceToDto(created!, service, menuPacks);
  }

  /**
   * Remove a service from a daily menu
   * Automatically removes all packs from that service and all service variants
   */
  async removeService(id: string, serviceId: string): Promise<void> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    // Only allow removal from DRAFT menus
    if (menu.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot remove service from menu with status ${menu.status}. Only DRAFT menus allow service removal.`,
      );
    }

    const dailyMenuService = await this.prisma.dailyMenuService.findUnique({
      where: {
        dailyMenuId_serviceId: {
          dailyMenuId: id,
          serviceId,
        },
      },
    });

    if (!dailyMenuService) {
      throw new NotFoundException('Service is not added to this daily menu');
    }

    // Get service packs
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        servicePacks: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    // Remove service, its variants, and its packs in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Remove all service variants
      await tx.dailyMenuServiceVariant.deleteMany({
        where: { dailyMenuServiceId: dailyMenuService.id },
      });

      // Remove all packs from this service
      const servicePackIds = service.servicePacks.map((sp) => sp.packId);
      await tx.dailyMenuPack.deleteMany({
        where: {
          dailyMenuId: id,
          packId: { in: servicePackIds },
        },
      });

      // Remove the service
      await tx.dailyMenuService.delete({
        where: { id: dailyMenuService.id },
      });
    });
  }

  /**
   * Add a variant to a service in a daily menu
   * The variant applies to all packs in the service that have the corresponding component
   */
  async addServiceVariant(
    id: string,
    serviceId: string,
    addVariantDto: AddVariantToDailyMenuServiceDto,
  ): Promise<DailyMenuServiceVariantDto> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    // Check if service is added to the menu
    const dailyMenuService = await this.prisma.dailyMenuService.findUnique({
      where: {
        dailyMenuId_serviceId: {
          dailyMenuId: id,
          serviceId,
        },
      },
      include: {
        service: {
          include: {
            servicePacks: {
              include: {
                pack: {
                  include: {
                    packComponents: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!dailyMenuService) {
      throw new NotFoundException('Service is not added to this daily menu');
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

    // Validate that the variant's component exists in at least one pack of the service
    const servicePackComponentIds = new Set<string>();
    for (const servicePack of dailyMenuService.service.servicePacks) {
      for (const packComponent of servicePack.pack.packComponents) {
        servicePackComponentIds.add(packComponent.componentId);
      }
    }

    if (!servicePackComponentIds.has(variant.componentId)) {
      throw new BadRequestException(
        `Variant's component "${variant.component.name}" does not exist in any pack of this service`,
      );
    }

    // Check if variant is already added
    const existing = await this.prisma.dailyMenuServiceVariant.findUnique({
      where: {
        dailyMenuServiceId_variantId: {
          dailyMenuServiceId: dailyMenuService.id,
          variantId: addVariantDto.variantId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Variant is already added to this service in the daily menu');
    }

    const dailyMenuServiceVariant = await this.prisma.dailyMenuServiceVariant.create({
      data: {
        dailyMenuServiceId: dailyMenuService.id,
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

    return this.mapDailyMenuServiceVariantToDto(dailyMenuServiceVariant);
  }

  /**
   * Remove a variant from a service in a daily menu
   * Only allowed for DRAFT menus
   */
  async removeServiceVariant(id: string, serviceId: string, variantId: string): Promise<void> {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Daily menu with ID ${id} not found`);
    }

    // Only allow removal from DRAFT menus
    if (menu.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot remove variant from service in menu with status ${menu.status}. Only DRAFT menus allow variant removal.`,
      );
    }

    // Check if service is added to the menu
    const dailyMenuService = await this.prisma.dailyMenuService.findUnique({
      where: {
        dailyMenuId_serviceId: {
          dailyMenuId: id,
          serviceId,
        },
      },
    });

    if (!dailyMenuService) {
      throw new NotFoundException('Service is not added to this daily menu');
    }

    // Check if variant exists in the service
    const dailyMenuServiceVariant = await this.prisma.dailyMenuServiceVariant.findUnique({
      where: {
        dailyMenuServiceId_variantId: {
          dailyMenuServiceId: dailyMenuService.id,
          variantId,
        },
      },
    });

    if (!dailyMenuServiceVariant) {
      throw new NotFoundException(
        `Variant with ID ${variantId} is not associated with this service in the daily menu`,
      );
    }

    // Delete the variant from the service
    await this.prisma.dailyMenuServiceVariant.delete({
      where: {
        dailyMenuServiceId_variantId: {
          dailyMenuServiceId: dailyMenuService.id,
          variantId,
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
          services: {
            include: {
              service: {
                include: {
                  servicePacks: {
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

      // Check service-level variants validation
      for (const dailyMenuService of menu.services) {
        const service = dailyMenuService.service;
        const serviceVariantComponentIds = new Set(
          dailyMenuService.variants.map((v) => v.variant.componentId),
        );

        // Check all packs in the service
        for (const servicePack of service.servicePacks) {
          const pack = servicePack.pack;

          // Check if pack has all required components covered by service variants
          const requiredComponents = pack.packComponents.filter((pc) => pc.required);
          for (const requiredComponent of requiredComponents) {
            if (!serviceVariantComponentIds.has(requiredComponent.componentId)) {
              warnings.push(
                `Service "${service.name}" - Pack "${pack.name}" is missing required component "${requiredComponent.component.name}" (no variant activated for this component in the service)`,
              );
            }
          }

          // Check if components have at least 2 variants
          const componentVariantCounts = new Map<string, number>();
          for (const variant of dailyMenuService.variants) {
            const count = componentVariantCounts.get(variant.variant.componentId) || 0;
            componentVariantCounts.set(variant.variant.componentId, count + 1);
          }

          for (const packComponent of pack.packComponents) {
            const variantCount = componentVariantCounts.get(packComponent.componentId) || 0;
            if (variantCount === 1) {
              warnings.push(
                `Service "${service.name}" - Component "${packComponent.component.name}" in pack "${pack.name}" has only 1 variant available`,
              );
            }
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

        // Compare with today's stock (pack-level variants)
        for (const variant of menu.variants) {
          const yesterdayVariantUsage = yesterdayUsage.get(variant.variantId) || 0;
          if (variant.initialStock < yesterdayVariantUsage) {
            warnings.push(
              `Variant "${variant.variant.name}" has stock ${variant.initialStock} which is less than yesterday's usage of ${yesterdayVariantUsage}`,
            );
          }
        }

        // Compare with today's stock (service-level variants)
        for (const dailyMenuService of menu.services) {
          for (const serviceVariant of dailyMenuService.variants) {
            const yesterdayVariantUsage = yesterdayUsage.get(serviceVariant.variantId) || 0;
            if (serviceVariant.initialStock < yesterdayVariantUsage) {
              warnings.push(
                `Service "${dailyMenuService.service.name}" - Variant "${serviceVariant.variant.name}" has stock ${serviceVariant.initialStock} which is less than yesterday's usage of ${yesterdayVariantUsage}`,
              );
            }
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
    // Get packs for each service
    const servicePackMap = new Map<string, any[]>();
    for (const dailyMenuService of menu.services || []) {
      const servicePackIds = dailyMenuService.service.servicePacks.map((sp: any) => sp.packId);
      const menuPacks = menu.packs.filter((p: any) => servicePackIds.includes(p.packId));
      servicePackMap.set(dailyMenuService.id, menuPacks);
    }

    return {
      ...this.mapToDto(menu),
      packs: menu.packs.map((p: any) => this.mapPackToDto(p)),
      variants: menu.variants.map((v: any) => this.mapVariantToDto(v)),
      services: (menu.services || []).map((s: any) => {
        const menuPacks = servicePackMap.get(s.id) || [];
        return this.mapDailyMenuServiceToDto(s, s.service, menuPacks);
      }),
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

  private mapDailyMenuServiceToDto(
    dailyMenuService: any,
    service: any,
    menuPacks: any[],
  ): DailyMenuServiceDto {
    return {
      id: dailyMenuService.id,
      dailyMenuId: dailyMenuService.dailyMenuId,
      serviceId: dailyMenuService.serviceId,
      serviceName: service.name,
      serviceDescription: service.description || undefined,
      packs: menuPacks.map((p: any) => this.mapPackToDto(p)),
      variants: (dailyMenuService.variants || []).map((v: any) =>
        this.mapDailyMenuServiceVariantToDto(v),
      ),
      createdAt: dailyMenuService.createdAt.toISOString(),
      updatedAt: dailyMenuService.updatedAt.toISOString(),
    };
  }

  private mapDailyMenuServiceVariantToDto(dailyMenuServiceVariant: any): DailyMenuServiceVariantDto {
    return {
      id: dailyMenuServiceVariant.id,
      dailyMenuServiceId: dailyMenuServiceVariant.dailyMenuServiceId,
      variantId: dailyMenuServiceVariant.variantId,
      variantName: dailyMenuServiceVariant.variant.name,
      componentId: dailyMenuServiceVariant.variant.componentId,
      componentName: dailyMenuServiceVariant.variant.component.name,
      initialStock: dailyMenuServiceVariant.initialStock,
      createdAt: dailyMenuServiceVariant.createdAt.toISOString(),
      updatedAt: dailyMenuServiceVariant.updatedAt.toISOString(),
    };
  }
}
