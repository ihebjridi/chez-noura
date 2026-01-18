import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderingLockService } from './ordering-lock.service';

/**
 * Centralized service to check if ordering is allowed for a given date
 * Enforces time-boxed ordering rules
 */
@Injectable()
export class OrderingCutoffService {
  constructor(
    private prisma: PrismaService,
    private orderingLockService: OrderingLockService,
  ) {}

  /**
   * Check if ordering is still allowed for a given date
   * @param orderDate - The date the order is for (ISO date string)
   * @returns true if ordering is allowed, throws BadRequestException if not
   */
  async checkOrderingAllowed(orderDate: string): Promise<boolean> {
    // Check if ordering is manually locked
    if (this.orderingLockService.isLocked(orderDate)) {
      throw new BadRequestException('Ordering is locked for this date');
    }

    const date = new Date(orderDate);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const now = new Date();

    // Find meals available for this date
    const meals = await this.prisma.meal.findMany({
      where: {
        availableDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: 'ACTIVE',
      },
    });

    if (meals.length === 0) {
      throw new BadRequestException('No meals available for this date');
    }

    // Check if any meal's cutoff time has passed
    const hasPassedCutoff = meals.some((meal) => {
      const cutoffTime = new Date(meal.cutoffTime);
      return now > cutoffTime;
    });

    if (hasPassedCutoff) {
      throw new BadRequestException('Ordering cutoff time has passed for this date');
    }

    return true;
  }

  /**
   * Get the cutoff time for a given date
   * @param orderDate - The date the order is for (ISO date string)
   * @returns The earliest cutoff time for meals on this date, or null if no meals
   */
  async getCutoffTimeForDate(orderDate: string): Promise<Date | null> {
    const date = new Date(orderDate);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const meals = await this.prisma.meal.findMany({
      where: {
        availableDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: 'ACTIVE',
      },
      orderBy: {
        cutoffTime: 'asc',
      },
      take: 1,
    });

    return meals.length > 0 ? meals[0].cutoffTime : null;
  }
}
