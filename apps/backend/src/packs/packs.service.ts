import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PackDto,
  PackWithComponentsDto,
  AvailablePackDto,
  CreatePackDto,
  UpdatePackDto,
  CreatePackComponentDto,
  PackComponentDto,
  TokenPayload,
  UserRole,
  AvailableComponentDto,
  AvailableVariantDto,
  PackStatisticsDto,
  RecentOrderDto,
  ComponentPackUsageDto,
} from '@contracts/core';
import { Prisma } from '@prisma/client';

@Injectable()
export class PacksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new pack
   * Only SUPER_ADMIN can create packs
   */
  async create(createPackDto: CreatePackDto, user: TokenPayload): Promise<PackDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can create packs');
    }

    const pack = await this.prisma.pack.create({
      data: {
        name: createPackDto.name,
        price: createPackDto.price,
        isActive: createPackDto.isActive ?? true,
      },
    });

    return this.mapPackToDto(pack);
  }

  /**
   * Get all packs
   * SUPER_ADMIN sees all, others see only active packs
   */
  async findAll(user?: TokenPayload): Promise<PackDto[]> {
    const where: Prisma.PackWhereInput = {};

    // Only show active packs to non-SUPER_ADMIN users
    if (user && user.role !== UserRole.SUPER_ADMIN) {
      where.isActive = true;
    }

    const packs = await this.prisma.pack.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    return packs.map((pack) => this.mapPackToDto(pack));
  }

  /**
   * Get a pack by ID with its components
   */
  async findOne(id: string, user?: TokenPayload): Promise<PackWithComponentsDto> {
    const pack = await this.prisma.pack.findUnique({
      where: { id },
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
    });

    if (!pack) {
      throw new NotFoundException(`Pack with ID ${id} not found`);
    }

    // Non-SUPER_ADMIN users can only see active packs
    if (user && user.role !== UserRole.SUPER_ADMIN && !pack.isActive) {
      throw new NotFoundException(`Pack with ID ${id} not found`);
    }

    return this.mapPackWithComponentsToDto(pack);
  }

  /**
   * Update a pack
   * Only SUPER_ADMIN can update packs
   */
  async update(
    id: string,
    updatePackDto: UpdatePackDto,
    user: TokenPayload,
  ): Promise<PackDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can update packs');
    }

    const existingPack = await this.prisma.pack.findUnique({
      where: { id },
    });

    if (!existingPack) {
      throw new NotFoundException(`Pack with ID ${id} not found`);
    }

    const updateData: Prisma.PackUpdateInput = {};

    if (updatePackDto.name !== undefined) {
      updateData.name = updatePackDto.name;
    }

    if (updatePackDto.price !== undefined) {
      updateData.price = updatePackDto.price;
    }

    if (updatePackDto.isActive !== undefined) {
      updateData.isActive = updatePackDto.isActive;
    }

    const updatedPack = await this.prisma.pack.update({
      where: { id },
      data: updateData,
    });

    return this.mapPackToDto(updatedPack);
  }

  /**
   * Add a component to a pack
   * Only SUPER_ADMIN can add components to packs
   */
  async addComponent(
    packId: string,
    createPackComponentDto: CreatePackComponentDto,
    user: TokenPayload,
  ): Promise<PackComponentDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can add components to packs');
    }

    // Verify pack exists
    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
    });

    if (!pack) {
      throw new NotFoundException(`Pack with ID ${packId} not found`);
    }

    // Verify component exists
    const component = await this.prisma.component.findUnique({
      where: { id: createPackComponentDto.componentId },
    });

    if (!component) {
      throw new NotFoundException(
        `Component with ID ${createPackComponentDto.componentId} not found`,
      );
    }

    // Check if component is already in pack
    const existing = await this.prisma.packComponent.findUnique({
      where: {
        packId_componentId: {
          packId,
          componentId: createPackComponentDto.componentId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Component is already in this pack');
    }

    // Check if pack is part of a service with active business subscriptions
    const servicePack = await this.prisma.servicePack.findUnique({
      where: { packId },
      include: {
        service: {
          include: {
            businessServices: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (servicePack && servicePack.service.businessServices.length > 0) {
      throw new BadRequestException(
        `Cannot modify pack components: this pack is part of service "${servicePack.service.name}" which has ${servicePack.service.businessServices.length} active business subscription(s). Pack components cannot be changed once a service is subscribed to.`,
      );
    }

    const packComponent = await this.prisma.packComponent.create({
      data: {
        packId,
        componentId: createPackComponentDto.componentId,
        required: createPackComponentDto.required,
        orderIndex: createPackComponentDto.orderIndex,
      },
      include: {
        component: true,
      },
    });

    return this.mapPackComponentToDto(packComponent);
  }

  /**
   * Remove a component from a pack
   * Only SUPER_ADMIN can remove components from packs
   * Cannot remove if pack is part of a service with active business subscriptions
   */
  async removeComponent(
    packId: string,
    componentId: string,
    user: TokenPayload,
  ): Promise<void> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can remove components from packs');
    }

    // Verify pack exists
    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
    });

    if (!pack) {
      throw new NotFoundException(`Pack with ID ${packId} not found`);
    }

    // Check if pack component exists
    const packComponent = await this.prisma.packComponent.findUnique({
      where: {
        packId_componentId: {
          packId,
          componentId,
        },
      },
    });

    if (!packComponent) {
      throw new NotFoundException('Component is not in this pack');
    }

    // Check if pack is part of a service with active business subscriptions
    const servicePack = await this.prisma.servicePack.findUnique({
      where: { packId },
      include: {
        service: {
          include: {
            businessServices: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (servicePack && servicePack.service.businessServices.length > 0) {
      throw new BadRequestException(
        `Cannot modify pack components: this pack is part of service "${servicePack.service.name}" which has ${servicePack.service.businessServices.length} active business subscription(s). Pack components cannot be changed once a service is subscribed to.`,
      );
    }

    // Delete the pack component
    await this.prisma.packComponent.delete({
      where: {
        packId_componentId: {
          packId,
          componentId,
        },
      },
    });
  }

  /**
   * Get components for a pack
   */
  async getPackComponents(packId: string): Promise<PackComponentDto[]> {
    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
    });

    if (!pack) {
      throw new NotFoundException(`Pack with ID ${packId} not found`);
    }

    const packComponents = await this.prisma.packComponent.findMany({
      where: { packId },
      include: {
        component: true,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    return packComponents.map((pc) => this.mapPackComponentToDto(pc));
  }

  /**
   * Get packs that include a given component (for component-centric "Used in packs" view)
   */
  async getPacksByComponentId(componentId: string): Promise<ComponentPackUsageDto[]> {
    const component = await this.prisma.component.findUnique({
      where: { id: componentId },
    });
    if (!component) {
      throw new NotFoundException(`Component with ID ${componentId} not found`);
    }
    const packComponents = await this.prisma.packComponent.findMany({
      where: { componentId },
      include: { pack: true },
      orderBy: { orderIndex: 'asc' },
    });
    return packComponents.map((pc) => ({
      packId: pc.packId,
      packName: pc.pack.name,
      required: pc.required,
      orderIndex: pc.orderIndex,
    }));
  }

  /**
   * Get available packs with components and variants for a specific date
   * Only shows packs and variants from PUBLISHED DailyMenu
   * Only shows variants with available stock from DailyMenuVariant
   */
  async getAvailablePacks(date: string): Promise<AvailablePackDto[]> {
    const orderDate = new Date(date);
    if (isNaN(orderDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    orderDate.setHours(0, 0, 0, 0);

    // Find PUBLISHED DailyMenu for this date
    const dailyMenu = await this.prisma.dailyMenu.findUnique({
      where: { date: orderDate },
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
      throw new NotFoundException(`No published menu found for date ${date}`);
    }

    if (dailyMenu.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Menu for date ${date} is not published. Current status: ${dailyMenu.status}`,
      );
    }

    // Build variant map from DailyMenuVariant (using initialStock)
    const variantStockMap = new Map<string, number>();
    const variantMap = new Map<string, any>();
    for (const dailyMenuVariant of dailyMenu.variants) {
      variantStockMap.set(dailyMenuVariant.variantId, dailyMenuVariant.initialStock);
      variantMap.set(dailyMenuVariant.variantId, dailyMenuVariant.variant);
    }

    // Filter packs that have at least one variant for each required component
    const availablePacks: AvailablePackDto[] = [];

    for (const dailyMenuPack of dailyMenu.packs) {
      const pack = dailyMenuPack.pack;
      const components: AvailableComponentDto[] = [];

      for (const packComponent of pack.packComponents) {
        const component = packComponent.component;
        
        // Get variants for this component from DailyMenu
        const availableVariants: AvailableVariantDto[] = [];
        for (const [variantId, variant] of variantMap.entries()) {
          if (variant.componentId === component.id && variant.isActive) {
            const stock = variantStockMap.get(variantId) || 0;
            if (stock > 0) {
              availableVariants.push({
                id: variant.id,
                name: variant.name,
                stockQuantity: stock,
                isActive: variant.isActive,
              });
            }
          }
        }

        // Sort variants by name
        availableVariants.sort((a, b) => a.name.localeCompare(b.name));

        // If component is required and has no available variants, skip this pack
        if (packComponent.required && availableVariants.length === 0) {
          break; // Skip to next pack
        }

        components.push({
          id: component.id,
          name: component.name,
          required: packComponent.required,
          orderIndex: packComponent.orderIndex,
          variants: availableVariants,
        });
      }

      // Only include pack if all required components have variants
      const allRequiredHaveVariants = pack.packComponents
        .filter((pc) => pc.required)
        .every((pc) => {
          const component = components.find((c) => c.id === pc.componentId);
          return component && component.variants.length > 0;
        });

      if (allRequiredHaveVariants) {
        availablePacks.push({
          id: pack.id,
          name: pack.name,
          price: Number(pack.price),
          isActive: pack.isActive,
          createdAt: pack.createdAt.toISOString(),
          updatedAt: pack.updatedAt.toISOString(),
          components,
        });
      }
    }

    return availablePacks;
  }

  private mapPackToDto(pack: any): PackDto {
    return {
      id: pack.id,
      name: pack.name,
      price: Number(pack.price),
      isActive: pack.isActive,
      createdAt: pack.createdAt.toISOString(),
      updatedAt: pack.updatedAt.toISOString(),
    };
  }

  private mapPackWithComponentsToDto(pack: any): PackWithComponentsDto {
    return {
      ...this.mapPackToDto(pack),
      components: pack.packComponents.map((pc: any) => this.mapPackComponentToDto(pc)),
    };
  }

  private mapPackComponentToDto(packComponent: any): PackComponentDto {
    return {
      id: packComponent.id,
      packId: packComponent.packId,
      componentId: packComponent.componentId,
      componentName: packComponent.component.name,
      required: packComponent.required,
      orderIndex: packComponent.orderIndex,
    };
  }

  /**
   * Get statistics for a pack
   * Returns order count, revenue, and recent orders
   */
  async getPackStatistics(packId: string): Promise<PackStatisticsDto> {
    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
      include: {
        packComponents: true,
      },
    });

    if (!pack) {
      throw new NotFoundException(`Pack with ID ${packId} not found`);
    }

    // Get all orders for this pack
    const orders = await this.prisma.order.findMany({
      where: { packId },
      include: {
        business: {
          select: {
            name: true,
          },
        },
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
      take: 20, // Recent 20 orders
    });

    const totalOrders = await this.prisma.order.count({
      where: { packId },
    });

    const totalRevenue = orders.reduce((sum, order) => {
      return sum + Number(order.totalAmount);
    }, 0);

    // Get all-time revenue (not just recent orders)
    const allOrders = await this.prisma.order.findMany({
      where: { packId },
      select: {
        totalAmount: true,
      },
    });

    const allTimeRevenue = allOrders.reduce((sum, order) => {
      return sum + Number(order.totalAmount);
    }, 0);

    const recentOrders: RecentOrderDto[] = orders.slice(0, 10).map((order) => ({
      orderId: order.id,
      orderDate: order.orderDate.toISOString().split('T')[0],
      status: order.status,
      totalAmount: Number(order.totalAmount),
      businessName: order.business?.name,
      employeeName: order.employee
        ? `${order.employee.firstName} ${order.employee.lastName}`
        : undefined,
    }));

    const lastOrder = orders[0];
    const lastOrderDate = lastOrder ? lastOrder.orderDate.toISOString().split('T')[0] : null;

    return {
      packId: pack.id,
      packName: pack.name,
      totalOrders,
      totalRevenue: allTimeRevenue,
      recentOrders,
      lastOrderDate,
      componentCount: pack.packComponents.length,
    };
  }
}
