import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderingCutoffService } from '../common/services/ordering-cutoff.service';
import { OrderingLockService } from '../common/services/ordering-lock.service';
import { OpsService } from '../ops/ops.service';
import {
  CreateOrderDto,
  OrderDto,
  TokenPayload,
  UserRole,
  OrderStatus,
} from '@contracts/core';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private orderingCutoffService: OrderingCutoffService,
    private orderingLockService: OrderingLockService,
    private opsService: OpsService,
  ) {}

  /**
   * Create a new order
   * Only EMPLOYEE can create orders
   * Idempotent: prevents duplicate orders per employee per day
   */
  async createOrder(
    createOrderDto: CreateOrderDto,
    user: TokenPayload,
    idempotencyKey?: string,
  ): Promise<OrderDto> {
    // Only EMPLOYEE can create orders
    if (user.role !== UserRole.EMPLOYEE) {
      throw new ForbiddenException('Only employees can create orders');
    }

    if (!user.employeeId || !user.businessId) {
      throw new BadRequestException('Employee must be associated with a business');
    }

    // Check if business is active (disabled businesses cannot place orders)
    const business = await this.prisma.business.findUnique({
      where: { id: user.businessId },
      select: { status: true },
    });

    if (!business || business.status !== 'ACTIVE') {
      throw new BadRequestException('Business is disabled and cannot place orders');
    }

    // Check if ordering is manually locked for this date
    if (this.orderingLockService.isLocked(createOrderDto.orderDate)) {
      throw new BadRequestException('Ordering is locked for this date');
    }

    // Check if day is locked in database (persistent lock)
    const isDayLocked = await this.opsService.isDayLocked(createOrderDto.orderDate);
    if (isDayLocked) {
      throw new BadRequestException('This day has been locked. No new orders can be created.');
    }

    // Check if ordering is still allowed for this date (cutoff time check)
    // This will throw if cutoff has passed
    await this.orderingCutoffService.checkOrderingAllowed(createOrderDto.orderDate);

    // Check for existing order for this employee on this date (idempotency)
    const orderDate = new Date(createOrderDto.orderDate);
    orderDate.setHours(0, 0, 0, 0);
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

    if (existingOrder) {
      // Return existing order if found (idempotent behavior)
      return this.mapOrderToDto(existingOrder);
    }

    // Verify employee exists and belongs to the business
    const employee = await this.prisma.employee.findUnique({
      where: { id: user.employeeId },
      include: { business: true },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    if (employee.businessId !== user.businessId) {
      throw new ForbiddenException('Employee does not belong to this business');
    }

    // Fetch and validate pack
    const pack = await this.prisma.pack.findUnique({
      where: { id: createOrderDto.packId },
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
      throw new BadRequestException(`Pack with ID ${createOrderDto.packId} not found`);
    }

    if (!pack.isActive) {
      throw new BadRequestException('Pack is not active');
    }

    // Validate all required components are selected
    const requiredComponents = pack.packComponents.filter((pc) => pc.required);
    const selectedComponentIds = new Set(createOrderDto.items.map((item) => item.componentId));

    for (const requiredComponent of requiredComponents) {
      if (!selectedComponentIds.has(requiredComponent.componentId)) {
        throw new BadRequestException(
          `Required component "${requiredComponent.component.name}" is missing`,
        );
      }
    }

    // Validate no duplicate components
    const componentIdsInOrder = createOrderDto.items.map((item) => item.componentId);
    const uniqueComponentIds = new Set(componentIdsInOrder);
    if (componentIdsInOrder.length !== uniqueComponentIds.size) {
      throw new BadRequestException('Duplicate component selections are not allowed');
    }

    // Fetch all variants and validate
    const variantIds = createOrderDto.items.map((item) => item.variantId);
    const variants = await this.prisma.variant.findMany({
      where: {
        id: { in: variantIds },
        isActive: true,
      },
      include: {
        component: true,
      },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException('One or more variants not found or inactive');
    }

    // Validate variants belong to correct components and have stock
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    for (const item of createOrderDto.items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new BadRequestException(`Variant ${item.variantId} not found`);
      }

      if (variant.componentId !== item.componentId) {
        throw new BadRequestException(
          `Variant ${variant.name} does not belong to component ${item.componentId}`,
        );
      }

      if (variant.stockQuantity <= 0) {
        throw new BadRequestException(
          `Variant "${variant.name}" is out of stock`,
        );
      }
    }

    // Calculate total amount (pack price)
    const totalAmount = Number(pack.price);

    // Create order with items and decrement stock in a transaction
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        // Re-check stock within transaction to prevent race conditions
        const variantsInTx = await tx.variant.findMany({
          where: {
            id: { in: variantIds },
          },
        });

        // Verify stock is still available
        for (const variant of variantsInTx) {
          if (variant.stockQuantity <= 0) {
            throw new BadRequestException(
              `Variant "${variant.name}" is out of stock`,
            );
          }
        }

        // Create order
        const newOrder = await tx.order.create({
          data: {
            employeeId: user.employeeId,
            businessId: user.businessId,
            packId: pack.id,
            orderDate: new Date(createOrderDto.orderDate),
            status: OrderStatus.CREATED,
            totalAmount,
            items: {
              create: createOrderDto.items.map((item) => ({
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

        // Decrement stock for all variants atomically
        await Promise.all(
          variantsInTx.map((variant) =>
            tx.variant.update({
              where: { id: variant.id },
              data: {
                stockQuantity: {
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
        // Race condition: order was created between check and create
        // Fetch and return the existing order
        const orderDate = new Date(createOrderDto.orderDate);
        orderDate.setHours(0, 0, 0, 0);
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

        if (existingOrder) {
          return this.mapOrderToDto(existingOrder);
        }
      }
      throw error;
    }
  }

  /**
   * Get orders for the current employee
   * Only EMPLOYEE can access this endpoint
   */
  async getMyOrders(user: TokenPayload): Promise<OrderDto[]> {
    if (user.role !== UserRole.EMPLOYEE) {
      throw new ForbiddenException('Only employees can access their own orders');
    }

    if (!user.employeeId) {
      throw new BadRequestException('Employee ID not found');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        employeeId: user.employeeId,
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
      orderBy: {
        orderDate: 'desc',
      },
    });

    return orders.map((order) => this.mapOrderToDto(order));
  }

  /**
   * Get orders for a business
   * BUSINESS_ADMIN can see orders for their business
   * SUPER_ADMIN can see all orders or filter by business
   */
  async getBusinessOrders(user: TokenPayload): Promise<OrderDto[]> {
    if (user.role !== UserRole.BUSINESS_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only business admins and super admins can access business orders');
    }

    const where: Prisma.OrderWhereInput = {};

    // BUSINESS_ADMIN is scoped to their business
    if (user.role === UserRole.BUSINESS_ADMIN) {
      if (!user.businessId) {
        throw new BadRequestException('Business ID not found');
      }
      where.businessId = user.businessId;
    }

    const orders = await this.prisma.order.findMany({
      where,
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
      orderBy: {
        orderDate: 'desc',
      },
    });

    return orders.map((order) => this.mapOrderToDto(order));
  }

  /**
   * Get all orders (admin view)
   * Only SUPER_ADMIN can access this endpoint
   */
  async getAdminOrders(user: TokenPayload): Promise<OrderDto[]> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can access all orders');
    }

    const orders = await this.prisma.order.findMany({
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
      orderBy: {
        orderDate: 'desc',
      },
    });

    return orders.map((order) => this.mapOrderToDto(order));
  }

  /**
   * Check if an order can be modified (not locked)
   * Orders are locked after cutoff time or if day is locked
   */
  private async canModifyOrder(orderId: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return false;
    }

    // If order is already LOCKED or CANCELLED, it cannot be modified
    if (order.status === 'LOCKED' || order.status === 'CANCELLED') {
      return false;
    }

    const orderDateStr = order.orderDate.toISOString().split('T')[0];

    // Check if day is locked in database (persistent lock)
    const isDayLocked = await this.opsService.isDayLocked(orderDateStr);
    if (isDayLocked) {
      // Day is locked, update order status to LOCKED if still CREATED
      if (order.status === 'CREATED') {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'LOCKED' },
        });
      }
      return false;
    }

    // Check if cutoff has passed
    try {
      await this.orderingCutoffService.checkOrderingAllowed(orderDateStr);
      return true; // Cutoff hasn't passed, can modify
    } catch (error) {
      // Cutoff has passed, order should be locked
      // Lock the order if it's still CREATED
      if (order.status === 'CREATED') {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'LOCKED' },
        });
      }
      return false;
    }
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
