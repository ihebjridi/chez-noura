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

    // Find PUBLISHED DailyMenu for this date
    const orderDate = new Date(createOrderDto.orderDate);
    orderDate.setHours(0, 0, 0, 0);

    const dailyMenu = await this.prisma.dailyMenu.findUnique({
      where: { date: orderDate },
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

    if (!dailyMenu) {
      throw new BadRequestException(`No published menu found for date ${createOrderDto.orderDate}`);
    }

    if (dailyMenu.status === 'LOCKED') {
      throw new BadRequestException('This menu has been locked. No new orders can be created.');
    }

    if (dailyMenu.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Menu for date ${createOrderDto.orderDate} is not published. Current status: ${dailyMenu.status}`,
      );
    }

    // Check if ordering is still allowed for this date (cutoff time check)
    // This will throw if cutoff has passed or order start time hasn't been reached
    await this.orderingCutoffService.checkOrderingAllowed(createOrderDto.orderDate, createOrderDto.packId);

    // Check for existing order for this employee on this date (idempotency)
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
                imageUrl: true,
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

    // Validate pack belongs to DailyMenu
    const dailyMenuPack = dailyMenu.packs.find((p) => p.packId === createOrderDto.packId);
    if (!dailyMenuPack) {
      throw new BadRequestException(
        `Pack with ID ${createOrderDto.packId} is not available in the menu for date ${createOrderDto.orderDate}`,
      );
    }

    const pack = dailyMenuPack.pack;

    if (!pack.isActive) {
      throw new BadRequestException('Pack is not active');
    }

    // Get pack components
    const packWithComponents = await this.prisma.pack.findUnique({
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

    if (!packWithComponents) {
      throw new BadRequestException(`Pack with ID ${createOrderDto.packId} not found`);
    }

    // Validate all required components are selected
    const requiredComponents = packWithComponents.packComponents.filter((pc) => pc.required);
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

    // Validate variants belong to DailyMenu and have stock
    const dailyMenuVariantMap = new Map(
      dailyMenu.variants.map((dmv) => [dmv.variantId, dmv]),
    );
    const variantMap = new Map(
      dailyMenu.variants.map((dmv) => [dmv.variantId, dmv.variant]),
    );

    for (const item of createOrderDto.items) {
      const dailyMenuVariant = dailyMenuVariantMap.get(item.variantId);
      if (!dailyMenuVariant) {
        throw new BadRequestException(
          `Variant ${item.variantId} is not available in the menu for date ${createOrderDto.orderDate}`,
        );
      }

      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new BadRequestException(`Variant ${item.variantId} not found`);
      }

      if (variant.componentId !== item.componentId) {
        throw new BadRequestException(
          `Variant ${variant.name} does not belong to component ${item.componentId}`,
        );
      }

      if (dailyMenuVariant.initialStock <= 0) {
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
        const dailyMenuVariantsInTx = await tx.dailyMenuVariant.findMany({
          where: {
            dailyMenuId: dailyMenu.id,
            variantId: { in: createOrderDto.items.map((item) => item.variantId) },
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

        // Decrement stock from DailyMenuVariant (not from Variant)
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
        // Race condition: order was created between check and create
        // Fetch and return the existing order
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
                imageUrl: true,
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
                imageUrl: true,
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
                imageUrl: true,
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
    // Format orderDate as YYYY-MM-DD in local timezone, not UTC
    // This ensures the date matches what was originally sent (e.g., "2024-01-26" stays "2024-01-26")
    const orderDateObj = order.orderDate instanceof Date ? order.orderDate : new Date(order.orderDate);
    const year = orderDateObj.getFullYear();
    const month = String(orderDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(orderDateObj.getDate()).padStart(2, '0');
    const orderDateString = `${year}-${month}-${day}`;

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
      orderDate: orderDateString,
      status: order.status as any,
      items: order.items.map((item: any) => ({
        id: item.id,
        componentId: item.componentId,
        componentName: item.component?.name || '',
        variantId: item.variantId,
        variantName: item.variant?.name || '',
        variantImageUrl: item.variant?.imageUrl || undefined,
      })),
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
