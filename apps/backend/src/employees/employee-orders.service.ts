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

    // Build pack-to-service mapping to check if variants are available via service
    const packToServiceMap = new Map<string, string>();
    for (const dailyMenuService of dailyMenu.services) {
      for (const servicePack of dailyMenuService.service.servicePacks) {
        packToServiceMap.set(servicePack.packId, dailyMenuService.serviceId);
      }
    }

    // Validate variants belong to DailyMenu and have stock.
    // Stock is per service: pack with service -> only that service's variants; pack without service -> pack-level only.
    const packServiceId = packToServiceMap.get(createOrderDto.packId);
    const dailyMenuVariantMap = new Map(
      dailyMenu.variants.map((dmv) => [dmv.variantId, dmv]),
    );
    const variantMap = new Map(
      dailyMenu.variants.map((dmv) => [dmv.variantId, dmv.variant]),
    );
    const serviceVariantMap = new Map<string, any>();
    for (const dailyMenuService of dailyMenu.services) {
      for (const serviceVariant of dailyMenuService.variants) {
        const key = `${dailyMenuService.serviceId}:${serviceVariant.variantId}`;
        serviceVariantMap.set(key, serviceVariant);
        if (!variantMap.has(serviceVariant.variantId)) {
          variantMap.set(serviceVariant.variantId, serviceVariant.variant);
        }
      }
    }

    for (const selectedVariant of createOrderDto.selectedVariants) {
      let dailyMenuVariant: any = null;
      if (packServiceId) {
        const serviceVariantKey = `${packServiceId}:${selectedVariant.variantId}`;
        const serviceVariant = serviceVariantMap.get(serviceVariantKey);
        if (serviceVariant) {
          dailyMenuVariant = {
            id: serviceVariant.id,
            variantId: serviceVariant.variantId,
            initialStock: serviceVariant.initialStock,
            variant: serviceVariant.variant,
          };
        }
      } else {
        dailyMenuVariant = dailyMenuVariantMap.get(selectedVariant.variantId);
      }

      if (!dailyMenuVariant) {
        throw new BadRequestException(
          `Variant ${selectedVariant.variantId} is not available in this daily menu`,
        );
      }

      const variant = variantMap.get(selectedVariant.variantId);
      if (!variant) {
        throw new BadRequestException(`Variant ${selectedVariant.variantId} not found`);
      }

      if (variant.componentId !== selectedVariant.componentId) {
        throw new BadRequestException(
          `Variant "${variant.name}" does not belong to component ${selectedVariant.componentId}`,
        );
      }

      if (dailyMenuVariant.initialStock <= 0) {
        throw new BadRequestException(`Variant "${variant.name}" is out of stock`);
      }
    }

    // Calculate order date from DailyMenu
    const orderDate = new Date(dailyMenu.date);
    orderDate.setHours(0, 0, 0, 0);

    // Get the service ID for the pack being ordered
    const serviceIdForPack = packToServiceMap.get(createOrderDto.packId);

    // Check for existing order for this employee on this date for the same service
    // Employees can place one order per service per day, not just one order per day
    const nextDay = new Date(orderDate);
    nextDay.setDate(nextDay.getDate() + 1);

    if (serviceIdForPack) {
      // Find all existing orders for this employee on this date
      const existingOrders = await this.prisma.order.findMany({
        where: {
          employeeId: user.employeeId,
          orderDate: {
            gte: orderDate,
            lt: nextDay,
          },
        },
        include: {
          pack: {
            include: {
              servicePack: {
                include: {
                  service: true,
                },
              },
            },
          },
        },
      });

      // Check if any existing order is for a pack in the same service
      for (const existingOrder of existingOrders) {
        const existingServiceId = existingOrder.pack.servicePack?.serviceId;
        if (existingServiceId === serviceIdForPack) {
          throw new ConflictException(
            `You have already placed an order for ${existingOrder.pack.servicePack.service.name} on this date. Only one order per service per day is allowed.`,
          );
        }
      }
    } else {
      // If pack doesn't belong to a service (legacy), check for any existing order (backward compatibility)
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
    }

    // Calculate total amount (pack price)
    const totalAmount = Number(pack.price);

    // Create order with items and decrement stock atomically in a transaction
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        // Re-check for existing order for the same service within transaction to prevent race conditions
        if (serviceIdForPack) {
          const existingOrdersInTx = await tx.order.findMany({
            where: {
              employeeId: user.employeeId,
              orderDate: {
                gte: orderDate,
                lt: nextDay,
              },
            },
            include: {
              pack: {
                include: {
                  servicePack: {
                    include: {
                      service: true,
                    },
                  },
                },
              },
            },
          });

          for (const existingOrder of existingOrdersInTx) {
            const existingServiceId = existingOrder.pack.servicePack?.serviceId;
            if (existingServiceId === serviceIdForPack) {
              throw new ConflictException(
                `You have already placed an order for ${existingOrder.pack.servicePack.service.name} on this date. Only one order per service per day is allowed.`,
              );
            }
          }
        } else {
          // Legacy: check for any existing order if pack doesn't belong to a service
          const existingOrderInTx = await tx.order.findFirst({
            where: {
              employeeId: user.employeeId,
              orderDate: {
                gte: orderDate,
                lt: nextDay,
              },
            },
          });

          if (existingOrderInTx) {
            throw new ConflictException('Employee can only place one order per day');
          }
        }

        // Re-check stock within transaction to prevent race conditions
        // Check both pack-level and service-level variants
        const variantIds = createOrderDto.selectedVariants.map((v) => v.variantId);
        
        const dailyMenuVariantsInTx = await tx.dailyMenuVariant.findMany({
          where: {
            dailyMenuId: dailyMenu.id,
            variantId: { in: variantIds },
          },
          include: {
            variant: true,
          },
        });

        // Load service-level variants from ALL services on the menu (shared components may be in another service)
        const allDailyMenuServices = await tx.dailyMenuService.findMany({
          where: {
            dailyMenuId: dailyMenu.id,
          },
        });

        const dailyMenuServiceVariantsInTx: any[] = [];
        for (const dms of allDailyMenuServices) {
          const serviceVariants = await tx.dailyMenuServiceVariant.findMany({
            where: {
              dailyMenuServiceId: dms.id,
              variantId: { in: variantIds },
            },
            include: {
              variant: true,
            },
          });
          dailyMenuServiceVariantsInTx.push(...serviceVariants);
        }

        // Stock is per service: pack with service -> decrement only that service's stock; pack without service -> pack-level only
        const packServiceIdInTx = packToServiceMap.get(createOrderDto.packId);
        const packDailyMenuServiceId = packServiceIdInTx
          ? allDailyMenuServices.find((dms) => dms.serviceId === packServiceIdInTx)?.id
          : undefined;

        const variantStockMap = new Map<string, { type: 'pack' | 'service'; stock: any }>();
        if (packDailyMenuServiceId) {
          for (const smv of dailyMenuServiceVariantsInTx) {
            if (smv.dailyMenuServiceId === packDailyMenuServiceId) {
              variantStockMap.set(smv.variantId, { type: 'service', stock: smv });
            }
          }
        } else {
          for (const dmv of dailyMenuVariantsInTx) {
            variantStockMap.set(dmv.variantId, { type: 'pack', stock: dmv });
          }
        }

        // Verify stock is still available for all selected variants
        for (const selectedVariant of createOrderDto.selectedVariants) {
          const stockInfo = variantStockMap.get(selectedVariant.variantId);
          if (!stockInfo) {
            throw new BadRequestException(
              `Variant ${selectedVariant.variantId} is not available in this daily menu`,
            );
          }
          if (stockInfo.stock.initialStock <= 0) {
            throw new BadRequestException(
              `Variant "${stockInfo.stock.variant.name}" is out of stock`,
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
          include: {
            servicePack: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
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

        // Decrement stock from the appropriate source (pack-level or service-level) atomically
        await Promise.all(
          createOrderDto.selectedVariants.map((selectedVariant) => {
            const stockInfo = variantStockMap.get(selectedVariant.variantId);
            if (!stockInfo) {
              throw new BadRequestException(
                `Variant ${selectedVariant.variantId} is not available in this daily menu`,
              );
            }

            if (stockInfo.type === 'pack') {
              return tx.dailyMenuVariant.update({
                where: { id: stockInfo.stock.id },
                data: {
                  initialStock: {
                    decrement: 1,
                  },
                },
              });
            } else {
              return tx.dailyMenuServiceVariant.update({
                where: { id: stockInfo.stock.id },
                data: {
                  initialStock: {
                    decrement: 1,
                  },
                },
              });
            }
          }),
        );

        return newOrder;
      });

      return this.mapOrderToDto(order);
    } catch (error) {
      // Handle any other errors that might occur during order creation
      // Note: Service-level duplicate checks are done before the transaction
      // The unique constraint on [employeeId, orderDate] has been removed to allow
      // multiple orders per day (one per service)
      throw error;
    }
  }

  /**
   * Get all orders for today for the current employee
   * Returns array of orders (can be multiple - one per service)
   */
  async getTodayOrders(user: TokenPayload): Promise<OrderDto[]> {
    if (user.role !== UserRole.EMPLOYEE) {
      throw new ForbiddenException('Only employees can access their orders');
    }

    if (!user.employeeId) {
      throw new BadRequestException('Employee ID not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);

    const orders = await this.prisma.order.findMany({
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
          include: {
            servicePack: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
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
        createdAt: 'desc',
      },
    });

    return orders.map((order) => this.mapOrderToDto(order));
  }

  /**
   * Get today's order for the current employee
   * Returns null if no order exists for today
   * @deprecated Use getTodayOrders instead to support multiple orders per day (one per service)
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
                imageUrl: true,
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
    const serviceId = order.pack?.servicePack?.serviceId;
    const serviceName = order.pack?.servicePack?.service?.name;
    
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
        variantImageUrl: item.variant?.imageUrl || undefined,
      })),
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      // Add service information (optional fields for backward compatibility)
      serviceId: serviceId || undefined,
      serviceName: serviceName || undefined,
    } as OrderDto;
  }
}
