import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  KitchenSummaryDto,
  KitchenBusinessSummaryDto,
  KitchenDetailedSummaryDto,
  KitchenOrderSummaryDto,
  DayLockDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';
import { Prisma } from '@prisma/client';

@Injectable()
export class OpsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lock all orders for a given date
   * This prevents any further order creation or modification
   * Uses a transaction to ensure atomicity
   */
  async lockDay(date: string, user: TokenPayload): Promise<DayLockDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can lock days');
    }

    // Parse date string (YYYY-MM-DD) as local date, not UTC
    // This prevents timezone issues where "2024-01-26" becomes "2024-01-25"
    const dateParts = date.split('-');
    if (dateParts.length !== 3) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    const [year, month, day] = dateParts.map(Number);
    const lockDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (isNaN(lockDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Check if already locked
    const existingLock = await this.prisma.dayLock.findUnique({
      where: { lockDate: lockDate },
    });

    if (existingLock) {
      throw new ConflictException(`Day ${date} is already locked`);
    }

    // Use transaction to lock day and update all orders atomically
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the day lock
      const dayLock = await tx.dayLock.create({
        data: {
          lockDate: lockDate,
          lockedBy: user.userId,
        },
      });

      // Update all CREATED orders for this date to LOCKED
      const updateResult = await tx.order.updateMany({
        where: {
          orderDate: {
            gte: lockDate,
            lte: endOfDay,
          },
          status: 'CREATED',
        },
        data: {
          status: 'LOCKED',
        },
      });

      return {
        dayLock,
        ordersLocked: updateResult.count,
      };
    });

    return {
      date: date,
      locked: true,
      lockedAt: result.dayLock.lockedAt.toISOString(),
      lockedBy: result.dayLock.lockedBy || undefined,
      ordersLocked: result.ordersLocked,
    };
  }

  /**
   * Check if a day is locked
   */
  async isDayLocked(date: string): Promise<boolean> {
    // Parse date string (YYYY-MM-DD) as local date, not UTC
    const dateParts = date.split('-');
    if (dateParts.length !== 3) {
      return false;
    }
    const [year, month, day] = dateParts.map(Number);
    const lockDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (isNaN(lockDate.getTime())) {
      return false;
    }

    const lock = await this.prisma.dayLock.findUnique({
      where: { lockDate: lockDate },
    });

    return !!lock;
  }

  /**
   * Get kitchen summary for a date (aggregated by variant)
   * Only includes LOCKED orders
   */
  async getSummary(
    date: string,
    format: 'json' | 'csv' = 'json',
  ): Promise<KitchenSummaryDto | string> {
    // Parse date string (YYYY-MM-DD) as local date, not UTC
    // This prevents timezone issues where "2024-01-26" becomes "2024-01-25"
    const dateParts = date.split('-');
    if (dateParts.length !== 3) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    const [year, month, day] = dateParts.map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (isNaN(startOfDay.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Get day lock info
    const dayLock = await this.prisma.dayLock.findUnique({
      where: { lockDate: startOfDay },
    });

    // Aggregate order items for LOCKED orders only
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          orderDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'LOCKED',
        },
      },
      include: {
        variant: {
          select: {
            id: true,
            name: true,
          },
        },
        component: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          include: {
            pack: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      } as any,
    }) as any[];

    // Aggregate by variant
    const variantMap = new Map<
      string,
      {
        variantId: string;
        variantName: string;
        componentId: string;
        componentName: string;
        packId: string;
        packName: string;
        totalQuantity: number;
      }
    >();

    for (const item of orderItems) {
      const variantId = item.variantId;
      const existing = variantMap.get(variantId);

      if (existing) {
        existing.totalQuantity += 1; // Each order item represents one variant selection
      } else {
        variantMap.set(variantId, {
          variantId: item.variant.id,
          variantName: item.variant.name,
          componentId: item.component.id,
          componentName: item.component.name,
          packId: item.order.pack.id,
          packName: item.order.pack.name,
          totalQuantity: 1,
        });
      }
    }

    const variants = Array.from(variantMap.values()).map((variant) => ({
      variantId: variant.variantId,
      variantName: variant.variantName,
      componentId: variant.componentId,
      componentName: variant.componentName,
      packId: variant.packId,
      packName: variant.packName,
      totalQuantity: variant.totalQuantity,
    }));

    const totalVariants = variants.reduce((sum, v) => sum + v.totalQuantity, 0);

    const summary = {
      date: date,
      totalVariants,
      variants,
      lockedAt: dayLock?.lockedAt.toISOString(),
    } as unknown as KitchenSummaryDto;

    if (format === 'csv') {
      return this.formatSummaryAsCsv(summary);
    }

    return summary;
  }

  /**
   * Get kitchen summary with business breakdown
   * Only includes LOCKED orders
   */
  async getBusinessSummary(
    date: string,
    format: 'json' | 'csv' = 'json',
  ): Promise<KitchenBusinessSummaryDto | string> {
    // Parse date string (YYYY-MM-DD) as local date, not UTC
    // This prevents timezone issues where "2024-01-26" becomes "2024-01-25"
    const dateParts = date.split('-');
    if (dateParts.length !== 3) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    const [year, month, day] = dateParts.map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (isNaN(startOfDay.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Get day lock info
    const dayLock = await this.prisma.dayLock.findUnique({
      where: { lockDate: startOfDay },
    });

    // First, get all LOCKED orders for the date (uses composite index)
    const orders = await this.prisma.order.findMany({
      where: {
        orderDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'LOCKED',
      },
      select: {
        id: true,
        businessId: true,
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (orders.length === 0) {
      const summary = {
        date: date,
        totalVariants: 0,
        variants: [],
        lockedAt: dayLock?.lockedAt.toISOString(),
      } as unknown as KitchenBusinessSummaryDto;
      return format === 'csv' ? this.formatBusinessSummaryAsCsv(summary) : summary;
    }

    const orderIds = orders.map((o) => o.id);
    const businessMap = new Map(
      orders.map((o) => [o.id, { id: o.businessId, name: o.business.name }]),
    );

    // Then get order items for those orders
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        orderId: {
          in: orderIds,
        },
      },
      include: {
        variant: {
          select: {
            id: true,
            name: true,
          },
        },
        component: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          include: {
            pack: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      } as any,
    }) as any[];

    // Aggregate by variant, then by business
    const variantMap = new Map<
      string,
      {
        variantId: string;
        variantName: string;
        componentId: string;
        componentName: string;
        packId: string;
        packName: string;
        businesses: Map<
          string,
          {
            businessId: string;
            businessName: string;
            quantity: number;
          }
        >;
        totalQuantity: number;
      }
    >();

    for (const item of orderItems) {
      const variantId = item.variantId;
      const business = businessMap.get(item.orderId);
      if (!business) continue; // Skip if business not found (shouldn't happen)
      const businessId = business.id;
      const businessName = business.name;

      let variantData = variantMap.get(variantId);
      if (!variantData) {
        variantData = {
          variantId: item.variant.id,
          variantName: item.variant.name,
          componentId: item.component.id,
          componentName: item.component.name,
          packId: item.order.pack.id,
          packName: item.order.pack.name,
          businesses: new Map(),
          totalQuantity: 0,
        };
        variantMap.set(variantId, variantData);
      }

      let businessData = variantData.businesses.get(businessId);
      if (!businessData) {
        businessData = {
          businessId,
          businessName,
          quantity: 0,
        };
        variantData.businesses.set(businessId, businessData);
      }

      businessData.quantity += 1; // Each order item represents one variant selection
      variantData.totalQuantity += 1;
    }

    const variants = Array.from(variantMap.values()).map((variant) => ({
      variantId: variant.variantId,
      variantName: variant.variantName,
      componentId: variant.componentId,
      componentName: variant.componentName,
      packId: variant.packId,
      packName: variant.packName,
      totalQuantity: variant.totalQuantity,
      businesses: Array.from(variant.businesses.values()),
    }));

    const totalVariants = variants.reduce((sum, v) => sum + v.totalQuantity, 0);

    const summary = {
      date: date,
      totalVariants,
      variants,
      lockedAt: dayLock?.lockedAt.toISOString(),
    } as unknown as KitchenBusinessSummaryDto;

    if (format === 'csv') {
      return this.formatBusinessSummaryAsCsv(summary);
    }

    return summary;
  }

  /**
   * Format summary as CSV
   */
  private formatSummaryAsCsv(summary: any): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Date,Variant ID,Variant Name,Component ID,Component Name,Pack ID,Pack Name,Quantity');
    
    // Data rows
    for (const variant of summary.variants) {
      lines.push(
        `${summary.date},${variant.variantId},"${variant.variantName}",${variant.componentId},"${variant.componentName}",${variant.packId},"${variant.packName}",${variant.totalQuantity}`,
      );
    }
    
    // Footer
    lines.push('');
    lines.push(`Total Variants,${summary.totalVariants}`);
    
    if (summary.lockedAt) {
      lines.push(`Locked At,${summary.lockedAt}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Format business summary as CSV
   */
  private formatBusinessSummaryAsCsv(
    summary: any,
  ): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Date,Variant ID,Variant Name,Component ID,Component Name,Pack ID,Pack Name,Business ID,Business Name,Quantity');
    
    // Data rows
    for (const variant of summary.variants) {
      for (const business of variant.businesses) {
        lines.push(
          `${summary.date},${variant.variantId},"${variant.variantName}",${variant.componentId},"${variant.componentName}",${variant.packId},"${variant.packName}",${business.businessId},"${business.businessName}",${business.quantity}`,
        );
      }
    }
    
    // Footer
    lines.push('');
    lines.push(`Total Variants,${summary.totalVariants}`);
    
    if (summary.lockedAt) {
      lines.push(`Locked At,${summary.lockedAt}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Get detailed kitchen summary for a date
   * Includes both variant aggregation and individual order details
   * Includes both CREATED and LOCKED orders (kitchen needs to see orders throughout the day)
   */
  async getDetailedSummary(date: string): Promise<KitchenDetailedSummaryDto> {
    // Parse date string (YYYY-MM-DD) as local date, not UTC
    // This prevents timezone issues where "2024-01-26" becomes "2024-01-25"
    const dateParts = date.split('-');
    if (dateParts.length !== 3) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    const [year, month, day] = dateParts.map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (isNaN(startOfDay.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Get day lock info
    const dayLock = await this.prisma.dayLock.findUnique({
      where: { lockDate: startOfDay },
    });

    // Get all CREATED and LOCKED orders for the date with full details
    // Kitchen needs to see orders throughout the day, not just after locking
    const orders = await this.prisma.order.findMany({
      where: {
        orderDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['CREATED', 'LOCKED'],
        },
      },
      include: {
        employee: {
          select: {
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
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            component: {
              select: {
                id: true,
                name: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { business: { name: 'asc' } },
        { employee: { firstName: 'asc' } },
        { employee: { lastName: 'asc' } },
      ],
    });

    // Build order summaries
    const orderSummaries: KitchenOrderSummaryDto[] = orders.map((order) => ({
      orderId: order.id,
      businessName: order.business.name,
      employeeName: `${order.employee.firstName} ${order.employee.lastName}`,
      packName: order.pack.name,
      packId: order.pack.id,
      variants: order.items.map((item) => ({
        componentName: item.component.name,
        variantName: item.variant.name,
      })),
    }));

    // Aggregate variants (same logic as getSummary)
    const variantMap = new Map<
      string,
      {
        variantId: string;
        variantName: string;
        componentId: string;
        componentName: string;
        packId: string;
        packName: string;
        totalQuantity: number;
      }
    >();

    for (const order of orders) {
      for (const item of order.items) {
        const variantId = item.variantId;
        const existing = variantMap.get(variantId);

        if (existing) {
          existing.totalQuantity += 1;
        } else {
          variantMap.set(variantId, {
            variantId: item.variant.id,
            variantName: item.variant.name,
            componentId: item.component.id,
            componentName: item.component.name,
            packId: order.pack.id,
            packName: order.pack.name,
            totalQuantity: 1,
          });
        }
      }
    }

    const variants = Array.from(variantMap.values()).map((variant) => ({
      variantId: variant.variantId,
      variantName: variant.variantName,
      componentId: variant.componentId,
      componentName: variant.componentName,
      packId: variant.packId,
      packName: variant.packName,
      totalQuantity: variant.totalQuantity,
    }));

    const totalVariants = variants.reduce((sum, v) => sum + v.totalQuantity, 0);

    return {
      date: date,
      totalVariants,
      totalOrders: orders.length,
      variants,
      orders: orderSummaries,
      lockedAt: dayLock?.lockedAt.toISOString(),
    };
  }
}
