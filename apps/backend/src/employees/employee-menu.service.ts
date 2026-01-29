import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderingCutoffService } from '../common/services/ordering-cutoff.service';
import {
  EmployeeMenuDto,
  EmployeeMenuServiceWindowDto,
  AvailablePackDto,
  AvailableComponentDto,
  AvailableVariantDto,
  TokenPayload,
} from '@contracts/core';

@Injectable()
export class EmployeeMenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderingCutoffService: OrderingCutoffService,
  ) {}

  /**
   * Get DailyMenu for a specific date (published or unpublished)
   * Returns menu with available packs, components, and variants (stock > 0)
   * Filters packs by business's activated services
   * Returns 404 if no menu exists for the date
   * The status field indicates if the menu is published and available for ordering
   */
  async getMenuByDate(date: string, user: TokenPayload): Promise<EmployeeMenuDto> {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    // Resolve businessId: use from token, or for employees load from Employee record (handles legacy users without User.businessId)
    let businessId: string | undefined = user.businessId;
    if (!businessId && user.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: { businessId: true },
      });
      businessId = employee?.businessId;
    }

    // Validate that the requested date is not in the past
    // Orders can only be placed for today's menu, so past menus should not be accessible
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateObj.getTime() < today.getTime()) {
      throw new BadRequestException(
        'Menus for past dates are read-only and cannot be accessed for ordering. Orders can only be placed for today\'s menu.',
      );
    }

    const dailyMenu = await this.prisma.dailyMenu.findUnique({
      where: { date: dateObj },
      include: {
        packs: {
          include: {
            pack: {
              include: {
                packComponents: {
                  include: {
                    component: true,
                  },
                  orderBy: {
                    orderIndex: 'asc',
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

    if (!dailyMenu) {
      throw new NotFoundException(`No menu found for date ${date}`);
    }

    // Return menu even if not published - status field will indicate availability

    // Build variant map by component ID for quick lookup
    // Start with pack-level variants (for backward compatibility)
    const variantMapByComponent = new Map<string, AvailableVariantDto[]>();
    
    for (const dailyMenuVariant of dailyMenu.variants) {
      const variant = dailyMenuVariant.variant;
      const componentId = variant.componentId;
      
      // Only include variants with stock > 0
      if (dailyMenuVariant.initialStock > 0) {
        if (!variantMapByComponent.has(componentId)) {
          variantMapByComponent.set(componentId, []);
        }
        
        variantMapByComponent.get(componentId)!.push({
          id: variant.id,
          name: variant.name,
          stockQuantity: dailyMenuVariant.initialStock,
          isActive: variant.isActive,
          imageUrl: variant.imageUrl || undefined,
        });
      }
    }

    // Add service-level variants (apply to all packs in the service)
    // Build a map of pack IDs to their service IDs
    const packToServiceMap = new Map<string, string>();
    for (const dailyMenuService of dailyMenu.services) {
      for (const servicePack of dailyMenuService.service.servicePacks) {
        packToServiceMap.set(servicePack.packId, dailyMenuService.serviceId);
      }
    }

    // Add service variants to the variant map
    for (const dailyMenuService of dailyMenu.services) {
      for (const serviceVariant of dailyMenuService.variants) {
        const variant = serviceVariant.variant;
        const componentId = variant.componentId;
        
        // Only include variants with stock > 0
        if (serviceVariant.initialStock > 0) {
          if (!variantMapByComponent.has(componentId)) {
            variantMapByComponent.set(componentId, []);
          }
          
          // Check if variant already exists (from pack-level), if so, use the higher stock
          const existing = variantMapByComponent.get(componentId)!.find((v) => v.id === variant.id);
          if (existing) {
            // Use the higher stock value
            existing.stockQuantity = Math.max(existing.stockQuantity, serviceVariant.initialStock);
          } else {
            variantMapByComponent.get(componentId)!.push({
              id: variant.id,
              name: variant.name,
              stockQuantity: serviceVariant.initialStock,
              isActive: variant.isActive,
              imageUrl: variant.imageUrl || undefined,
            });
          }
        }
      }
    }

    // Get activated packs for this business (considering effective dates for pack changes)
    let activatedPackIds: Set<string> | null = null;
    if (businessId) {
      // Get all active BusinessServices for this business
      const businessServices = await this.prisma.businessService.findMany({
        where: {
          businessId,
          isActive: true,
        },
        include: {
          businessServicePacks: {
            where: {
              isActive: true,
            },
            include: {
              pack: true,
              nextPack: true,
            },
          },
        },
      });

      // Collect all activated pack IDs, considering effective dates
      activatedPackIds = new Set<string>();
      const menuDate = new Date(dailyMenu.date);
      menuDate.setHours(0, 0, 0, 0);

      for (const businessService of businessServices) {
        for (const businessServicePack of businessService.businessServicePacks) {
          // Check if there's a pending pack change that's effective for this menu date
          if (
            businessServicePack.nextPackId &&
            businessServicePack.effectiveDate &&
            menuDate >= businessServicePack.effectiveDate
          ) {
            // Use the next pack (pending change is effective)
            activatedPackIds.add(businessServicePack.nextPackId);
          } else {
            // Use the current pack
            activatedPackIds.add(businessServicePack.packId);
          }
        }
      }
    }

    // Services that are currently within their order window (for the menu date) are visible to employees
    const now = new Date();
    const menuDateForTime = new Date(dailyMenu.date);
    menuDateForTime.setHours(0, 0, 0, 0);
    const serviceIdsInWindow = new Set<string>();
    for (const dailyMenuService of dailyMenu.services) {
      const service = dailyMenuService.service;
      let withinWindow = true;
      if (service.orderStartTime) {
        const [startH, startM] = service.orderStartTime.split(':').map(Number);
        const windowStart = new Date(menuDateForTime);
        windowStart.setHours(startH, startM, 0, 0);
        if (now < windowStart) withinWindow = false;
      }
      if (withinWindow && service.cutoffTime) {
        const [endH, endM] = service.cutoffTime.split(':').map(Number);
        const windowEnd = new Date(menuDateForTime);
        windowEnd.setHours(endH, endM, 0, 0);
        if (now > windowEnd) withinWindow = false;
      }
      if (withinWindow) serviceIdsInWindow.add(dailyMenuService.serviceId);
    }

    // Build packs with components and available variants
    // Filter by: pack is active AND (no business services configured OR pack is activated)
    // AND pack's service is within its order window (or pack has no service)
    const availablePacks: AvailablePackDto[] = dailyMenu.packs
      .filter((dailyMenuPack) => {
        if (!dailyMenuPack.pack.isActive) {
          return false;
        }
        // If no business services are configured, show all packs (backward compatibility)
        if (!activatedPackIds) {
          // Still respect service order window: hide packs whose service is out of time
          const serviceId = packToServiceMap.get(dailyMenuPack.pack.id);
          if (!serviceId) return true;
          return serviceIdsInWindow.has(serviceId);
        }
        // Only show packs that are activated for this business
        if (!activatedPackIds.has(dailyMenuPack.pack.id)) {
          return false;
        }
        // Only show packs whose service is currently within its order window
        const serviceId = packToServiceMap.get(dailyMenuPack.pack.id);
        if (!serviceId) return true; // pack not attached to a service: show (e.g. legacy)
        return serviceIdsInWindow.has(serviceId);
      })
      .map((dailyMenuPack) => {
        const pack = dailyMenuPack.pack;
        
        // Get components for this pack
        const components: AvailableComponentDto[] = pack.packComponents.map((packComponent) => {
          const component = packComponent.component;
          const variants = variantMapByComponent.get(component.id) || [];
          
          return {
            id: component.id,
            name: component.name,
            required: packComponent.required,
            orderIndex: packComponent.orderIndex,
            variants,
          };
        });

        return {
          id: pack.id,
          name: pack.name,
          price: Number(pack.price),
          isActive: pack.isActive,
          createdAt: pack.createdAt.toISOString(),
          updatedAt: pack.updatedAt.toISOString(),
          components,
        };
      });

    // Only compute cutoff/order windows when there are available packs (avoid showing countdown with no packs)
    const visiblePackIds = new Set(availablePacks.map((p) => p.id));
    const serviceIds = new Set<string>();
    for (const dailyMenuService of dailyMenu.services) {
      for (const servicePack of dailyMenuService.service.servicePacks) {
        if (visiblePackIds.has(servicePack.packId)) {
          serviceIds.add(dailyMenuService.serviceId);
          break;
        }
      }
    }

    let cutoffTime: Date | null = null;
    let orderStartTime: Date | null = null;
    const serviceWindows: EmployeeMenuServiceWindowDto[] = [];

    if (availablePacks.length > 0) {
      // Per-service windows for countdown (each available service gets its own)
      for (const dailyMenuService of dailyMenu.services) {
        if (!serviceIds.has(dailyMenuService.serviceId)) continue;
        const service = dailyMenuService.service;
        if (!service.cutoffTime) continue;

        const [cutoffH, cutoffM] = service.cutoffTime.split(':').map(Number);
        const serviceCutoff = new Date(dailyMenu.date);
        serviceCutoff.setHours(cutoffH, cutoffM, 0, 0);

        let orderStartIso: string | undefined;
        if (service.orderStartTime) {
          const [startH, startM] = service.orderStartTime.split(':').map(Number);
          const serviceStart = new Date(dailyMenu.date);
          serviceStart.setHours(startH, startM, 0, 0);
          orderStartIso = serviceStart.toISOString();
        }

        serviceWindows.push({
          serviceId: service.id,
          serviceName: service.name,
          cutoffTime: serviceCutoff.toISOString(),
          orderStartTime: orderStartIso,
        });
      }

      // Global cutoff/order start: earliest cutoff and latest order start from services with visible packs
      const serviceCutoffTimes: Date[] = [];
      const serviceOrderStartTimes: Date[] = [];
      for (const dailyMenuService of dailyMenu.services) {
        if (serviceIds.has(dailyMenuService.serviceId) || (!activatedPackIds && dailyMenu.services.length === 0)) {
          const service = dailyMenuService.service;
          if (service.cutoffTime) {
            const [hours, minutes] = service.cutoffTime.split(':').map(Number);
            const serviceCutoff = new Date(dailyMenu.date);
            serviceCutoff.setHours(hours, minutes, 0, 0);
            serviceCutoffTimes.push(serviceCutoff);
          }
          if (service.orderStartTime) {
            const [hours, minutes] = service.orderStartTime.split(':').map(Number);
            const serviceStart = new Date(dailyMenu.date);
            serviceStart.setHours(hours, minutes, 0, 0);
            serviceOrderStartTimes.push(serviceStart);
          }
        }
      }

      if (serviceCutoffTimes.length > 0) {
        cutoffTime = new Date(Math.min(...serviceCutoffTimes.map((d) => d.getTime())));
      } else if (dailyMenu.cutoffHour) {
        const [hours, minutes] = dailyMenu.cutoffHour.split(':').map(Number);
        cutoffTime = new Date(dailyMenu.date);
        cutoffTime.setHours(hours, minutes, 0, 0);
      } else {
        cutoffTime = await this.orderingCutoffService.getCutoffTimeForDate(
          dailyMenu.date.toISOString().split('T')[0],
        );
      }

      if (serviceOrderStartTimes.length > 0) {
        orderStartTime = new Date(Math.max(...serviceOrderStartTimes.map((d) => d.getTime())));
      }
    }

    return {
      id: dailyMenu.id,
      date: dailyMenu.date.toISOString().split('T')[0],
      status: dailyMenu.status,
      packs: availablePacks,
      cutoffTime: cutoffTime ? cutoffTime.toISOString() : undefined,
      orderStartTime: orderStartTime ? orderStartTime.toISOString() : undefined,
      serviceWindows: serviceWindows.length > 0 ? serviceWindows : undefined,
    };
  }
}
