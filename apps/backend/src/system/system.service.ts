import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderingLockService } from '../common/services/ordering-lock.service';
import { OrderingCutoffService } from '../common/services/ordering-cutoff.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemService {
  constructor(
    private orderingLockService: OrderingLockService,
    private orderingCutoffService: OrderingCutoffService,
    private prisma: PrismaService,
  ) {}

  async getStatus() {
    const dbStatus = await this.checkDatabase();
    const today = new Date().toISOString().split('T')[0];
    const orderingLocked = this.orderingLockService.isLocked(today);
    
    let cutoffTime: Date | null = null;
    try {
      cutoffTime = await this.orderingCutoffService.getCutoffTimeForDate(today);
    } catch (error) {
      // Ignore errors when checking cutoff
    }

    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus ? 'operational' : 'degraded',
        ordering: {
          locked: orderingLocked,
          cutoffTime: cutoffTime?.toISOString() || null,
        },
      },
    };
  }

  async lockOrdering(date: string) {
    this.orderingLockService.lock(date);
    return {
      success: true,
      message: `Ordering locked for ${date}`,
      date,
    };
  }

  async unlockOrdering(date: string) {
    this.orderingLockService.unlock(date);
    return {
      success: true,
      message: `Ordering unlocked for ${date}`,
      date,
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}
