import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderingCutoffService } from '../common/services/ordering-cutoff.service';
import { OrderingLockService } from '../common/services/ordering-lock.service';
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

    // Check if ordering is manually locked for this date
    if (this.orderingLockService.isLocked(createOrderDto.orderDate)) {
      throw new BadRequestException('Ordering is locked for this date');
    }

    // Check if ordering is still allowed for this date (cutoff time check)
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
        items: {
          include: {
            meal: {
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

    // Fetch meals and calculate total
    const mealIds = createOrderDto.items.map((item) => item.mealId);
    const meals = await this.prisma.meal.findMany({
      where: {
        id: { in: mealIds },
        status: 'ACTIVE',
      },
    });

    if (meals.length !== mealIds.length) {
      throw new BadRequestException('One or more meals not found or inactive');
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = createOrderDto.items.map((item) => {
      const meal = meals.find((m) => m.id === item.mealId);
      if (!meal) {
        throw new BadRequestException(`Meal ${item.mealId} not found`);
      }
      const itemTotal = Number(meal.price) * item.quantity;
      totalAmount += itemTotal;
      return {
        mealId: meal.id,
        quantity: item.quantity,
        unitPrice: meal.price,
      };
    });

    // Create order with items (with duplicate prevention)
    try {
      const order = await this.prisma.order.create({
        data: {
          employeeId: user.employeeId,
          businessId: user.businessId,
          orderDate: new Date(createOrderDto.orderDate),
          status: OrderStatus.PENDING,
          totalAmount,
          items: {
            create: orderItems,
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
          items: {
            include: {
              meal: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
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
            items: {
              include: {
                meal: {
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

  private mapOrderToDto(order: any): OrderDto {
    return {
      id: order.id,
      employeeId: order.employeeId,
      employeeEmail: order.employee.email,
      employeeName: `${order.employee.firstName} ${order.employee.lastName}`,
      businessId: order.businessId,
      businessName: order.business.name,
      orderDate: order.orderDate.toISOString().split('T')[0],
      status: order.status as any,
      items: order.items.map((item: any) => ({
        id: item.id,
        mealId: item.mealId,
        mealName: item.meal.name,
        mealPrice: Number(item.unitPrice),
        quantity: item.quantity,
      })),
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
