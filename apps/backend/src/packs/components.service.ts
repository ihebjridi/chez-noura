import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';
import {
  ComponentDto,
  CreateComponentDto,
  VariantDto,
  CreateVariantDto,
  UpdateVariantDto,
  TokenPayload,
  UserRole,
  ComponentStatisticsDto,
  VariantStatisticsDto,
  RecentOrderDto,
  RecentUsageDto,
} from '@contracts/core';
import { Prisma } from '@prisma/client';
import { Express } from 'express';

@Injectable()
export class ComponentsService {
  constructor(
    private prisma: PrismaService,
    private fileStorageService: FileStorageService,
  ) {}

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
    imageFile?: Express.Multer.File,
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

    // Upload image if provided
    let imageUrl: string | undefined;
    if (imageFile) {
      const uploadResult = await this.fileStorageService.uploadVariantImage(imageFile);
      imageUrl = uploadResult.url;
    }

    const variant = await this.prisma.variant.create({
      data: {
        componentId,
        name: createVariantDto.name,
        stockQuantity: createVariantDto.stockQuantity,
        isActive: createVariantDto.isActive ?? true,
        imageUrl,
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
    imageFile?: Express.Multer.File,
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

    // Handle image upload
    if (imageFile) {
      // Delete old image if it exists
      if (existingVariant.imageUrl) {
        await this.fileStorageService.deleteFile(existingVariant.imageUrl);
      }
      // Upload new image
      const uploadResult = await this.fileStorageService.uploadVariantImage(imageFile);
      updateData.imageUrl = uploadResult.url;
    } else if (updateVariantDto.imageUrl === null || updateVariantDto.imageUrl === '') {
      // Explicitly remove image if imageUrl is set to null/empty
      if (existingVariant.imageUrl) {
        await this.fileStorageService.deleteFile(existingVariant.imageUrl);
      }
      updateData.imageUrl = null;
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

  /**
   * Delete a variant
   * Only SUPER_ADMIN can delete variants
   * Cannot delete if variant is referenced by any OrderItems
   */
  async deleteVariant(variantId: string, user: TokenPayload): Promise<void> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can delete variants');
    }

    const variant = await this.prisma.variant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    // Check if variant is referenced by any OrderItems
    const orderItemCount = await this.prisma.orderItem.count({
      where: { variantId },
    });

    if (orderItemCount > 0) {
      throw new BadRequestException(
        `Cannot delete variant: it is referenced by ${orderItemCount} order item(s). Variants that have been used in orders cannot be deleted to maintain data integrity.`,
      );
    }

    // Delete image file if it exists
    if (variant.imageUrl) {
      await this.fileStorageService.deleteFile(variant.imageUrl);
    }

    // Delete the variant
    // DailyMenuVariants will be cascade deleted automatically
    await this.prisma.variant.delete({
      where: { id: variantId },
    });
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
      imageUrl: variant.imageUrl || undefined,
      isActive: variant.isActive,
      createdAt: variant.createdAt.toISOString(),
      updatedAt: variant.updatedAt.toISOString(),
    };
  }

  /**
   * Get statistics for a component
   * Returns usage count, variant count, pack count, and recent usage
   */
  async getComponentStatistics(componentId: string): Promise<ComponentStatisticsDto> {
    const component = await this.prisma.component.findUnique({
      where: { id: componentId },
      include: {
        variants: true,
        packComponents: {
          include: {
            pack: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!component) {
      throw new NotFoundException(`Component with ID ${componentId} not found`);
    }

    // Get all order items that use this component
    const orderItems = await this.prisma.orderItem.findMany({
      where: { componentId },
      include: {
        order: {
          include: {
            pack: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: {
          orderDate: 'desc',
        },
      },
    });

    const totalUsage = orderItems.length;

    // Group by date for recent usage
    const usageByDate = new Map<string, { count: number; packNames: Set<string> }>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const item of orderItems) {
      const orderDate = item.order.orderDate.toISOString().split('T')[0];
      if (item.order.orderDate >= thirtyDaysAgo) {
        if (!usageByDate.has(orderDate)) {
          usageByDate.set(orderDate, { count: 0, packNames: new Set() });
        }
        const usage = usageByDate.get(orderDate)!;
        usage.count++;
        if (item.order.pack?.name) {
          usage.packNames.add(item.order.pack.name);
        }
      }
    }

    const recentUsage: RecentUsageDto[] = Array.from(usageByDate.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        packNames: Array.from(data.packNames),
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);

    const lastUsedItem = orderItems[0];
    const lastUsedDate = lastUsedItem
      ? lastUsedItem.order.orderDate.toISOString().split('T')[0]
      : null;

    return {
      componentId: component.id,
      componentName: component.name,
      totalUsage,
      variantCount: component.variants.length,
      packCount: component.packComponents.length,
      recentUsage,
      lastUsedDate,
    };
  }

  /**
   * Get statistics for a variant
   * Returns order count and recent orders
   */
  async getVariantStatistics(variantId: string): Promise<VariantStatisticsDto> {
    const variant = await this.prisma.variant.findUnique({
      where: { id: variantId },
      include: {
        component: true,
      },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    // Get all order items that use this variant
    const orderItems = await this.prisma.orderItem.findMany({
      where: { variantId },
      include: {
        order: {
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
        },
      },
      orderBy: {
        order: {
          orderDate: 'desc',
        },
      },
      take: 20,
    });

    const totalOrders = await this.prisma.orderItem.count({
      where: { variantId },
    });

    const recentOrders: RecentOrderDto[] = orderItems.slice(0, 10).map((item) => ({
      orderId: item.order.id,
      orderDate: item.order.orderDate.toISOString().split('T')[0],
      status: item.order.status,
      totalAmount: Number(item.order.totalAmount),
      businessName: item.order.business?.name,
      employeeName: item.order.employee
        ? `${item.order.employee.firstName} ${item.order.employee.lastName}`
        : undefined,
    }));

    const lastOrderItem = orderItems[0];
    const lastOrderDate = lastOrderItem
      ? lastOrderItem.order.orderDate.toISOString().split('T')[0]
      : null;

    return {
      variantId: variant.id,
      variantName: variant.name,
      componentId: variant.componentId,
      componentName: variant.component.name,
      totalOrders,
      recentOrders,
      lastOrderDate,
      currentStock: variant.stockQuantity,
    };
  }
}
