import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ComponentDto,
  CreateComponentDto,
  VariantDto,
  CreateVariantDto,
  UpdateVariantDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';
import { Prisma } from '@prisma/client';

@Injectable()
export class ComponentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new component
   * Only SUPER_ADMIN can create components
   */
  async createComponent(
    createComponentDto: CreateComponentDto,
    user: TokenPayload,
  ): Promise<ComponentDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can create components');
    }

    const component = await this.prisma.component.create({
      data: {
        name: createComponentDto.name,
      },
    });

    return this.mapComponentToDto(component);
  }

  /**
   * Get all components
   */
  async findAllComponents(): Promise<ComponentDto[]> {
    const components = await this.prisma.component.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return components.map((component) => this.mapComponentToDto(component));
  }

  /**
   * Create a variant for a component
   * Only SUPER_ADMIN can create variants
   */
  async createVariant(
    componentId: string,
    createVariantDto: { name: string; stockQuantity: number; isActive?: boolean },
    user: TokenPayload,
  ): Promise<VariantDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can create variants');
    }

    // Verify component exists
    const component = await this.prisma.component.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      throw new NotFoundException(`Component with ID ${componentId} not found`);
    }

    // Check if variant name already exists for this component
    const existing = await this.prisma.variant.findUnique({
      where: {
        componentId_name: {
          componentId,
          name: createVariantDto.name,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Variant "${createVariantDto.name}" already exists for this component`,
      );
    }

    const variant = await this.prisma.variant.create({
      data: {
        componentId,
        name: createVariantDto.name,
        stockQuantity: createVariantDto.stockQuantity,
        isActive: createVariantDto.isActive ?? true,
      },
      include: {
        component: true,
      },
    });

    return this.mapVariantToDto(variant);
  }

  /**
   * Update a variant
   * Only SUPER_ADMIN can update variants
   */
  async updateVariant(
    variantId: string,
    updateVariantDto: UpdateVariantDto,
    user: TokenPayload,
  ): Promise<VariantDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can update variants');
    }

    const existingVariant = await this.prisma.variant.findUnique({
      where: { id: variantId },
      include: {
        component: true,
      },
    });

    if (!existingVariant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    const updateData: Prisma.VariantUpdateInput = {};

    if (updateVariantDto.name !== undefined) {
      // Check if new name conflicts with existing variant
      const nameConflict = await this.prisma.variant.findUnique({
        where: {
          componentId_name: {
            componentId: existingVariant.componentId,
            name: updateVariantDto.name,
          },
        },
      });

      if (nameConflict && nameConflict.id !== variantId) {
        throw new BadRequestException(
          `Variant "${updateVariantDto.name}" already exists for this component`,
        );
      }

      updateData.name = updateVariantDto.name;
    }

    if (updateVariantDto.stockQuantity !== undefined) {
      if (updateVariantDto.stockQuantity < 0) {
        throw new BadRequestException('Stock quantity cannot be negative');
      }
      updateData.stockQuantity = updateVariantDto.stockQuantity;
    }

    if (updateVariantDto.isActive !== undefined) {
      updateData.isActive = updateVariantDto.isActive;
    }

    const updatedVariant = await this.prisma.variant.update({
      where: { id: variantId },
      data: updateData,
      include: {
        component: true,
      },
    });

    return this.mapVariantToDto(updatedVariant);
  }

  /**
   * Get all variants for a component
   */
  async getComponentVariants(componentId: string): Promise<VariantDto[]> {
    const component = await this.prisma.component.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      throw new NotFoundException(`Component with ID ${componentId} not found`);
    }

    const variants = await this.prisma.variant.findMany({
      where: { componentId },
      include: {
        component: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return variants.map((variant) => this.mapVariantToDto(variant));
  }

  private mapComponentToDto(component: any): ComponentDto {
    return {
      id: component.id,
      name: component.name,
      createdAt: component.createdAt.toISOString(),
      updatedAt: component.updatedAt.toISOString(),
    };
  }

  private mapVariantToDto(variant: any): VariantDto {
    return {
      id: variant.id,
      componentId: variant.componentId,
      componentName: variant.component.name,
      name: variant.name,
      stockQuantity: variant.stockQuantity,
      isActive: variant.isActive,
      createdAt: variant.createdAt.toISOString(),
      updatedAt: variant.updatedAt.toISOString(),
    };
  }
}
