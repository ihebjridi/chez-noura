import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderSummaryDto, TokenPayload, UserRole } from '@contracts/core';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get orders for a business
   * Scoped to the user's business (unless SUPER_ADMIN)
   */
  async getBusinessOrders(user: TokenPayload): Promise<OrderSummaryDto[]> {
    const where: any = {};

    // BUSINESS_ADMIN and EMPLOYEE are scoped to their business
    if (user.role !== UserRole.SUPER_ADMIN && user.businessId) {
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
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => ({
      orderId: order.id,
      employeeEmail: order.employee.email,
      employeeName: `${order.employee.firstName} ${order.employee.lastName}`,
      orderDate: order.orderDate.toISOString().split('T')[0],
      status: order.status as any,
      totalAmount: Number(order.totalAmount),
      itemCount: order.items.length,
    }));
  }
}
