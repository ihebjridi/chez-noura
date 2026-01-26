import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEmployeeOrderDto as CreateEmployeeOrderDtoInterface,
  OrderDto,
  TokenPayload,
  UserRole,
  OrderStatus,
} from '@contracts/core';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmployeeOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new order for an employee
   * Uses dailyMenuId instead of orderDate
   * Validates all business rules and decrements stock atomically
   */
  async createOrder(
    createOrderDto: CreateEmployeeOrderDtoInterface,
    user: TokenPayload,
  ): Promise<OrderDto> {
    // Only EMPLOYEE can create orders
    if (user.role !== UserRole.EMPLOYEE) {
      throw new ForbiddenException('Only employees can create orders');
    }

    if (!user.employeeId || !user.businessId) {
      throw new BadRequestException('Employee must be associated with a business');
    }

    // Validate employee exists and belongs to business
    const employee = await this.prisma.employee.findUnique({
      where: { id: user.employeeId },
      include: { business: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.businessId !== user.businessId) {
      throw new ForbiddenException('Employee does not belong to this business');
    }

    if (employee.status !== 'ACTIVE') {
      throw new BadRequestException('Employee is not active');
    }

    // Check if business is active
    if (employee.business.status !== 'ACTIVE') {
      throw new BadRequestException('Business is disabled and cannot place orders');
    }

    // Get DailyMenu with all related data
    const dailyMenu = await this.prisma.dailyMenu.findUnique({
      where: { id: createOrderDto.dailyMenuId },
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
      throw new NotFoundException(`Daily menu with ID ${createOrderDto.dailyMenuId} not found`);
    }

    // Validate DailyMenu is PUBLISHED
    if (dailyMenu.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Daily menu is not published. Current status: ${dailyMenu.status}`,
      );
    }

    // Validate that the dailyMenu date is today - orders can only be placed for today's menu
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const menuDate = new Date(dailyMenu.date);
    menuDate.setHours(0, 0, 0, 0);

    if (menuDate.getTime() !== today.getTime()) {
      throw new BadRequestException(
        'Orders can only be placed for today\'s menu. The selected menu is for a different date.',
      );
    }

    // Validate pack belongs to DailyMenu
    const dailyMenuPack = dailyMenu.packs.find((p) => p.packId === createOrderDto.packId);
    if (!dailyMenuPack) {
      throw new BadRequestException(
        `Pack with ID ${createOrderDto.packId} is not available in this daily menu`,
      );
    }

    const pack = dailyMenuPack.pack;
    if (!pack.isActive) {
      throw new BadRequestException('Pack is not active');
    }

    // Get pack components
    const packComponents = pack.packComponents;
    const requiredComponents = packComponents.filter((pc) => pc.required);

    // Validate all required components are selected
    const selectedComponentIds = new Set(
      createOrderDto.selectedVariants.map((v) => v.componentId),
    );

    for (const requiredComponent of requiredComponents) {
      if (!selectedComponentIds.has(requiredComponent.componentId)) {
        throw new BadRequestException(
          `Required component "${requiredComponent.component.name}" is missing`,
        );
      }
    }

    // Validate no duplicate components
    const componentIdsInOrder = createOrderDto.selectedVariants.map((v) => v.componentId);
    const uniqueComponentIds = new Set(componentIdsInOrder);
    if (componentIdsInOrder.length !== uniqueComponentIds.size) {
      throw new BadRequestException('Duplicate component selections are not allowed');
    }

    // Validate variants belong to DailyMenu and have stock
    const dailyMenuVariantMap = new Map(
      dailyMenu.variants.map((dmv) => [dmv.variantId, dmv]),
    );
    const variantMap = new Map(
      dailyMenu.variants.map((dmv) => [dmv.variantId, dmv.variant]),
    );

    for (const selectedVariant of createOrderDto.selectedVariants) {
      const dailyMenuVariant = dailyMenuVariantMap.get(selectedVariant.variantId);
      if (!dailyMenuVariant) {
        throw new BadRequestException(
          `Variant ${selectedVariant.variantId} is not available in this daily menu`,
        );
      }

      const variant = variantMap.get(selectedVariant.variantId);
      if (!variant) {
        throw new BadRequestException(`Variant ${selectedVariant.variantId} not found`);
      }

      // Validate variant belongs to the specified component
      if (variant.componentId !== selectedVariant.componentId) {
        throw new BadRequestException(
          `Variant "${variant.name}" does not belong to component ${selectedVariant.componentId}`,
        );
      }

      // Validate stock > 0
      if (dailyMenuVariant.initialStock <= 0) {
        throw new BadRequestException(`Variant "${variant.name}" is out of stock`);
      }
    }

    // Calculate order date from DailyMenu
    const orderDate = new Date(dailyMenu.date);
    orderDate.setHours(0, 0, 0, 0);

    // Check for existing order for this employee on this date (one order per day)
    const nextDay = new Date(orderDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingOrder = await this.prisma.order.findFirst({
      where: {
        employeeId: user.employeeId,
        orderDate: {
          gte: orderDate,
          lt: nextDay,
        },
      },
    });

    if (existingOrder) {
      throw new ConflictException('Employee can only place one order per day');
    }

    // Calculate total amount (pack price)
    const totalAmount = Number(pack.price);

    // Create order with items and decrement stock atomically in a transaction
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        // Re-check stock within transaction to prevent race conditions
        const dailyMenuVariantsInTx = await tx.dailyMenuVariant.findMany({
          where: {
            dailyMenuId: dailyMenu.id,
            variantId: { in: createOrderDto.selectedVariants.map((v) => v.variantId) },
          },
          include: {
            variant: true,
          },
        });

        // Verify stock is still available
        for (const dailyMenuVariant of dailyMenuVariantsInTx) {
          if (dailyMenuVariant.initialStock <= 0) {
            throw new BadRequestException(
              `Variant "${dailyMenuVariant.variant.name}" is out of stock`,
            );
          }
        }

        // Create order
        const newOrder = await tx.order.create({
          data: {
            employeeId: user.employeeId,
            businessId: user.businessId,
            packId: pack.id,
            dailyMenuId: dailyMenu.id,
            orderDate: orderDate,
            status: OrderStatus.CREATED,
            totalAmount,
            items: {
              create: createOrderDto.selectedVariants.map((item) => ({
                componentId: item.componentId,
                variantId: item.variantId,
              })),
            },
          },
          include: {
            employee: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            business: {
              select: {
                name: true,
              },
            },
            pack: {
              select: {
                name: true,
                price: true,
              },
            },
            items: {
              include: {
                component: {
                  select: {
                    name: true,
                  },
                },
                variant: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        // Decrement stock from DailyMenuVariant atomically
        await Promise.all(
          dailyMenuVariantsInTx.map((dailyMenuVariant) =>
            tx.dailyMenuVariant.update({
              where: { id: dailyMenuVariant.id },
              data: {
                initialStock: {
                  decrement: 1,
                },
              },
            }),
          ),
        );

        return newOrder;
      });

      return this.mapOrderToDto(order);
    } catch (error) {
      // Handle unique constraint violation (duplicate order)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Employee can only place one order per day');
      }
      throw error;
    }
  }

  /**
   * Get today's order for the current employee
   * Returns null if no order exists for today
   */
  async getTodayOrder(user: TokenPayload): Promise<OrderDto | null> {
    if (user.role !== UserRole.EMPLOYEE) {
      throw new ForbiddenException('Only employees can access their orders');
    }

    if (!user.employeeId) {
      throw new BadRequestException('Employee ID not found');
    }

    // Get today's date (start of day) - using same approach as createOrder
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);

    const order = await this.prisma.order.findFirst({
      where: {
        employeeId: user.employeeId,
        orderDate: {
          gte: today,
          lt: nextDay,
        },
      },
      include: {
        employee: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        business: {
          select: {
            name: true,
          },
        },
        pack: {
          select: {
            name: true,
            price: true,
          },
        },
        items: {
          include: {
            component: {
              select: {
                name: true,
              },
            },
            variant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Return null if no order found (explicit null for proper JSON serialization)
    return order ? this.mapOrderToDto(order) : null;
  }

  private mapOrderToDto(order: any): OrderDto {
    return {
      id: order.id,
      employeeId: order.employeeId,
      employeeEmail: order.employee.email,
      employeeName: `${order.employee.firstName} ${order.employee.lastName}`,
      businessId: order.businessId,
      businessName: order.business.name,
      packId: order.packId,
      packName: order.pack?.name || '',
      packPrice: order.pack ? Number(order.pack.price) : Number(order.totalAmount),
      orderDate: order.orderDate.toISOString().split('T')[0],
      status: order.status as any,
      items: order.items.map((item: any) => ({
        id: item.id,
        componentId: item.componentId,
        componentName: item.component?.name || '',
        variantId: item.variantId,
        variantName: item.variant?.name || '',
      })),
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
