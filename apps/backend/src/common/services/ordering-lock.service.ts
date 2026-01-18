import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Service to manage ordering locks per date
 * Allows admins to manually lock/unlock ordering for specific dates
 */
@Injectable()
export class OrderingLockService {
  private locks: Map<string, boolean> = new Map();

  constructor(private prisma: PrismaService) {}

  /**
   * Check if ordering is locked for a given date
   */
  isLocked(orderDate: string): boolean {
    const dateKey = this.getDateKey(orderDate);
    return this.locks.get(dateKey) || false;
  }

  /**
   * Lock ordering for a given date
   */
  lock(orderDate: string): void {
    const dateKey = this.getDateKey(orderDate);
    this.locks.set(dateKey, true);
  }

  /**
   * Unlock ordering for a given date
   */
  unlock(orderDate: string): void {
    const dateKey = this.getDateKey(orderDate);
    this.locks.set(dateKey, false);
  }

  /**
   * Get lock status for a date
   */
  getLockStatus(orderDate: string): { locked: boolean; date: string } {
    return {
      locked: this.isLocked(orderDate),
      date: orderDate,
    };
  }

  /**
   * Get all locks
   */
  getAllLocks(): Array<{ date: string; locked: boolean }> {
    return Array.from(this.locks.entries()).map(([date, locked]) => ({
      date,
      locked,
    }));
  }

  private getDateKey(orderDate: string): string {
    // Normalize date to YYYY-MM-DD format
    const date = new Date(orderDate);
    return date.toISOString().split('T')[0];
  }
}
