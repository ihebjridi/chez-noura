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
   * Get available packs with components and variants for a specific date
   * Only shows packs with available stock
   */
  async getAvailablePacks(date: string): Promise<AvailablePackDto[]> {
    const orderDate = new Date(date);
    if (isNaN(orderDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    // Get all active packs
    const packs = await this.prisma.pack.findMany({
      where: {
        isActive: true,
      },
      include: {
        packComponents: {
          include: {
            component: {
              include: {
                variants: {
                  where: {
                    isActive: true,
                    stockQuantity: {
                      gt: 0,
                    },
                  },
                  orderBy: {
                    name: 'asc',
                  },
                },
              },
            },
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Filter packs that have at least one variant for each required component
    const availablePacks: AvailablePackDto[] = [];

    for (const pack of packs) {
      const components: AvailableComponentDto[] = [];

      for (const packComponent of pack.packComponents) {
        const component = packComponent.component;
        const availableVariants = component.variants.filter(
          (v) => v.isActive && v.stockQuantity > 0,
        );

        // If component is required and has no available variants, skip this pack
        if (packComponent.required && availableVariants.length === 0) {
          break; // Skip to next pack
        }

        components.push({
          id: component.id,
          name: component.name,
          required: packComponent.required,
          orderIndex: packComponent.orderIndex,
          variants: availableVariants.map((v) => ({
            id: v.id,
            name: v.name,
            stockQuantity: v.stockQuantity,
            isActive: v.isActive,
          })),
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
}
