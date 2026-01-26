import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderingCutoffService } from '../common/services/ordering-cutoff.service';
import { EmployeeMenuDto, AvailablePackDto, AvailableComponentDto, AvailableVariantDto } from '@contracts/core';

@Injectable()
export class EmployeeMenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderingCutoffService: OrderingCutoffService,
  ) {}

  /**
   * Get DailyMenu for a specific date (published or unpublished)
   * Returns menu with available packs, components, and variants (stock > 0)
   * Returns 404 if no menu exists for the date
   * The status field indicates if the menu is published and available for ordering
   */
  async getMenuByDate(date: string): Promise<EmployeeMenuDto> {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

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
      },
    });

    if (!dailyMenu) {
      throw new NotFoundException(`No menu found for date ${date}`);
    }

    // Return menu even if not published - status field will indicate availability

    // Build variant map by component ID for quick lookup
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
        });
      }
    }

    // Build packs with components and available variants
    const availablePacks: AvailablePackDto[] = dailyMenu.packs
      .filter((dailyMenuPack) => dailyMenuPack.pack.isActive)
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

    // Get cutoff time for this date
    const cutoffTime = await this.orderingCutoffService.getCutoffTimeForDate(
      dailyMenu.date.toISOString().split('T')[0],
    );

    return {
      id: dailyMenu.id,
      date: dailyMenu.date.toISOString().split('T')[0],
      status: dailyMenu.status,
      packs: availablePacks,
      cutoffTime: cutoffTime ? cutoffTime.toISOString() : undefined,
    };
  }
}
