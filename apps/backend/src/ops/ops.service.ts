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

    const lockDate = new Date(date);
    if (isNaN(lockDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    // Normalize to start of day
    lockDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(lockDate);
    endOfDay.setHours(23, 59, 59, 999);

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
    const lockDate = new Date(date);
    if (isNaN(lockDate.getTime())) {
      return false;
    }
    lockDate.setHours(0, 0, 0, 0);

    const lock = await this.prisma.dayLock.findUnique({
      where: { lockDate: lockDate },
    });

    return !!lock;
  }

  /**
   * Get kitchen summary for a date (aggregated by meal)
   * Only includes LOCKED orders
   */
  async getSummary(
    date: string,
    format: 'json' | 'csv' = 'json',
  ): Promise<KitchenSummaryDto | string> {
    const summaryDate = new Date(date);
    if (isNaN(summaryDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const startOfDay = new Date(summaryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(summaryDate);
    endOfDay.setHours(23, 59, 59, 999);

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
        meal: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    // Aggregate by meal
    const mealMap = new Map<
      string,
      {
        mealId: string;
        mealName: string;
        unitPrice: number;
        totalQuantity: number;
        totalAmount: number;
      }
    >();

    for (const item of orderItems) {
      const mealId = item.mealId;
      const existing = mealMap.get(mealId);

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalAmount += Number(item.unitPrice) * item.quantity;
      } else {
        mealMap.set(mealId, {
          mealId: item.meal.id,
          mealName: item.meal.name,
          unitPrice: Number(item.meal.price),
          totalQuantity: item.quantity,
          totalAmount: Number(item.unitPrice) * item.quantity,
        });
      }
    }

    const meals = Array.from(mealMap.values()).map((meal) => ({
      mealId: meal.mealId,
      mealName: meal.mealName,
      totalQuantity: meal.totalQuantity,
      unitPrice: meal.unitPrice,
      totalAmount: meal.totalAmount,
    }));

    const totalMeals = meals.reduce((sum, meal) => sum + meal.totalQuantity, 0);
    const totalAmount = meals.reduce((sum, meal) => sum + meal.totalAmount, 0);

    const summary: KitchenSummaryDto = {
      date: date,
      totalMeals,
      totalAmount,
      meals,
      lockedAt: dayLock?.lockedAt.toISOString(),
    };

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
    const summaryDate = new Date(date);
    if (isNaN(summaryDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const startOfDay = new Date(summaryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(summaryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get day lock info
    const dayLock = await this.prisma.dayLock.findUnique({
      where: { lockDate: startOfDay },
    });

    // Aggregate order items with business info for LOCKED orders only
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
        meal: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        order: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Aggregate by meal, then by business
    const mealMap = new Map<
      string,
      {
        mealId: string;
        mealName: string;
        unitPrice: number;
        businesses: Map<
          string,
          {
            businessId: string;
            businessName: string;
            quantity: number;
            totalAmount: number;
          }
        >;
        totalQuantity: number;
        totalAmount: number;
      }
    >();

    for (const item of orderItems) {
      const mealId = item.mealId;
      const businessId = item.order.businessId;
      const businessName = item.order.business.name;

      let mealData = mealMap.get(mealId);
      if (!mealData) {
        mealData = {
          mealId: item.meal.id,
          mealName: item.meal.name,
          unitPrice: Number(item.meal.price),
          businesses: new Map(),
          totalQuantity: 0,
          totalAmount: 0,
        };
        mealMap.set(mealId, mealData);
      }

      let businessData = mealData.businesses.get(businessId);
      if (!businessData) {
        businessData = {
          businessId,
          businessName,
          quantity: 0,
          totalAmount: 0,
        };
        mealData.businesses.set(businessId, businessData);
      }

      businessData.quantity += item.quantity;
      businessData.totalAmount += Number(item.unitPrice) * item.quantity;
      mealData.totalQuantity += item.quantity;
      mealData.totalAmount += Number(item.unitPrice) * item.quantity;
    }

    const meals = Array.from(mealMap.values()).map((meal) => ({
      mealId: meal.mealId,
      mealName: meal.mealName,
      totalQuantity: meal.totalQuantity,
      unitPrice: meal.unitPrice,
      totalAmount: meal.totalAmount,
      businesses: Array.from(meal.businesses.values()),
    }));

    const totalMeals = meals.reduce((sum, meal) => sum + meal.totalQuantity, 0);
    const totalAmount = meals.reduce((sum, meal) => sum + meal.totalAmount, 0);

    const summary: KitchenBusinessSummaryDto = {
      date: date,
      totalMeals,
      totalAmount,
      meals,
      lockedAt: dayLock?.lockedAt.toISOString(),
    };

    if (format === 'csv') {
      return this.formatBusinessSummaryAsCsv(summary);
    }

    return summary;
  }

  /**
   * Format summary as CSV
   */
  private formatSummaryAsCsv(summary: KitchenSummaryDto): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Date,Meal ID,Meal Name,Quantity,Unit Price,Total Amount');
    
    // Data rows
    for (const meal of summary.meals) {
      lines.push(
        `${summary.date},${meal.mealId},"${meal.mealName}",${meal.totalQuantity},${meal.unitPrice},${meal.totalAmount}`,
      );
    }
    
    // Footer
    lines.push('');
    lines.push(`Total Meals,${summary.totalMeals}`);
    lines.push(`Total Amount,${summary.totalAmount}`);
    
    if (summary.lockedAt) {
      lines.push(`Locked At,${summary.lockedAt}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Format business summary as CSV
   */
  private formatBusinessSummaryAsCsv(
    summary: KitchenBusinessSummaryDto,
  ): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Date,Meal ID,Meal Name,Business ID,Business Name,Quantity,Unit Price,Total Amount');
    
    // Data rows
    for (const meal of summary.meals) {
      for (const business of meal.businesses) {
        lines.push(
          `${summary.date},${meal.mealId},"${meal.mealName}",${business.businessId},"${business.businessName}",${business.quantity},${meal.unitPrice},${business.totalAmount}`,
        );
      }
    }
    
    // Footer
    lines.push('');
    lines.push(`Total Meals,${summary.totalMeals}`);
    lines.push(`Total Amount,${summary.totalAmount}`);
    
    if (summary.lockedAt) {
      lines.push(`Locked At,${summary.lockedAt}`);
    }
    
    return lines.join('\n');
  }
}
