import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityLogDto, ActivityLogDto } from '@contracts/core';

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an activity log entry
   */
  async create(createActivityLogDto: CreateActivityLogDto): Promise<ActivityLogDto> {
    const activityLog = await this.prisma.activityLog.create({
      data: {
        userId: createActivityLogDto.userId,
        businessId: createActivityLogDto.businessId,
        action: createActivityLogDto.action,
        details: createActivityLogDto.details,
        ipAddress: createActivityLogDto.ipAddress,
        userAgent: createActivityLogDto.userAgent,
      },
    });

    return this.mapToDto(activityLog);
  }

  /**
   * Get activity logs for a business
   */
  async findByBusiness(businessId: string, limit: number = 100): Promise<ActivityLogDto[]> {
    const logs = await this.prisma.activityLog.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((log) => this.mapToDto(log));
  }

  /**
   * Get activity logs for a user
   */
  async findByUser(userId: string, limit: number = 100): Promise<ActivityLogDto[]> {
    const logs = await this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((log) => this.mapToDto(log));
  }

  /**
   * Get activity logs by action
   */
  async findByAction(action: string, limit: number = 100): Promise<ActivityLogDto[]> {
    const logs = await this.prisma.activityLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((log) => this.mapToDto(log));
  }

  /**
   * Map Prisma activity log to DTO
   */
  private mapToDto(activityLog: any): ActivityLogDto {
    return {
      id: activityLog.id,
      userId: activityLog.userId || undefined,
      businessId: activityLog.businessId || undefined,
      action: activityLog.action,
      details: activityLog.details || undefined,
      ipAddress: activityLog.ipAddress || undefined,
      userAgent: activityLog.userAgent || undefined,
      createdAt: activityLog.createdAt.toISOString(),
    };
  }
}
