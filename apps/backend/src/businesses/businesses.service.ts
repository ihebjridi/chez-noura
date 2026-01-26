import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OrderSummaryDto,
  TokenPayload,
  UserRole,
  BusinessDto,
  CreateBusinessDto,
  UpdateBusinessDto,
  EntityStatus,
} from '@contracts/core';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class BusinessesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ActivityLogsService))
    private activityLogsService: ActivityLogsService,
  ) {}

  /**
   * Create a new business with a BUSINESS_ADMIN user
   * Uses transaction to ensure atomicity
   */
  async create(
    createBusinessDto: CreateBusinessDto,
    user: TokenPayload,
  ): Promise<{ business: BusinessDto; adminCredentials: { email: string; temporaryPassword: string } }> {
    // Check if business name already exists
    const existingByName = await this.prisma.business.findUnique({
      where: { name: createBusinessDto.name },
    });

    if (existingByName) {
      throw new ConflictException('Business name already exists');
    }

    // Use adminEmail as business email if not provided
    const businessEmail = createBusinessDto.email || createBusinessDto.adminEmail;

    // Check if business email already exists
    const existingByEmail = await this.prisma.business.findUnique({
      where: { email: businessEmail },
    });

    if (existingByEmail) {
      throw new ConflictException('Business email already exists');
    }

    // Check if admin email already exists
    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: createBusinessDto.adminEmail },
    });

    if (existingAdmin) {
      throw new ConflictException('Admin email already exists');
    }

    // Generate temporary password
    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Use transaction to create business and admin user atomically
    const result = await this.prisma.$transaction(async (tx) => {
      // Create business
      const business = await tx.business.create({
        data: {
          name: createBusinessDto.name,
          legalName: createBusinessDto.legalName,
          email: businessEmail,
          phone: createBusinessDto.phone,
          address: createBusinessDto.address,
          status: EntityStatus.ACTIVE,
        },
      });

      // Create BUSINESS_ADMIN user
      const adminUser = await tx.user.create({
        data: {
          email: createBusinessDto.adminEmail,
          password: hashedPassword,
          role: UserRole.BUSINESS_ADMIN,
          businessId: business.id,
        },
      });

      return {
        business,
        adminUser,
      };
    });

    // Log business creation activity
    try {
      await this.activityLogsService.create({
        userId: user.userId,
        businessId: result.business.id,
        action: 'BUSINESS_CREATED',
        details: JSON.stringify({
          businessName: result.business.name,
          adminEmail: createBusinessDto.adminEmail,
        }),
      });
    } catch (error) {
      // Don't fail business creation if logging fails
      console.error('Failed to log business creation activity:', error);
    }

    return {
      business: this.mapToDto(result.business),
      adminCredentials: {
        email: createBusinessDto.adminEmail,
        temporaryPassword,
      },
    };
  }

  /**
   * Get all businesses (SUPER_ADMIN only)
   */
  async findAll(): Promise<BusinessDto[]> {
    const businesses = await this.prisma.business.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return businesses.map((business) => this.mapToDto(business));
  }

  /**
   * Get a business by ID
   */
  async findOne(id: string): Promise<BusinessDto> {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return this.mapToDto(business);
  }

  /**
   * Update a business
   */
  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<BusinessDto> {
    // Check if business exists
    const existing = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    // Check for name conflict if name is being updated
    if (updateBusinessDto.name && updateBusinessDto.name !== existing.name) {
      const nameConflict = await this.prisma.business.findUnique({
        where: { name: updateBusinessDto.name },
      });

      if (nameConflict) {
        throw new ConflictException('Business name already exists');
      }
    }

    // Check for email conflict if email is being updated
    if (updateBusinessDto.email && updateBusinessDto.email !== existing.email) {
      const emailConflict = await this.prisma.business.findUnique({
        where: { email: updateBusinessDto.email },
      });

      if (emailConflict) {
        throw new ConflictException('Business email already exists');
      }
    }

    try {
      const updated = await this.prisma.business.update({
        where: { id },
        data: {
          name: updateBusinessDto.name,
          legalName: updateBusinessDto.legalName,
          email: updateBusinessDto.email,
          phone: updateBusinessDto.phone,
          address: updateBusinessDto.address,
          status: updateBusinessDto.status,
        },
      });

      return this.mapToDto(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          throw new ConflictException('Business name or email already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Disable a business
   * Prevents the business from placing new orders
   */
  async disable(id: string): Promise<BusinessDto> {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    if (business.status === EntityStatus.INACTIVE) {
      throw new BadRequestException('Business is already disabled');
    }

    const updated = await this.prisma.business.update({
      where: { id },
      data: {
        status: EntityStatus.INACTIVE,
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Delete a business
   * Only allowed if there are no related records (users, employees, orders, invoices)
   */
  async delete(id: string, user: TokenPayload): Promise<void> {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    // Check for related records
    const [users, employees, orders, invoices] = await Promise.all([
      this.prisma.user.count({ where: { businessId: id } }),
      this.prisma.employee.count({ where: { businessId: id } }),
      this.prisma.order.count({ where: { businessId: id } }),
      this.prisma.invoice.count({ where: { businessId: id } }),
    ]);

    if (users > 0 || employees > 0 || orders > 0 || invoices > 0) {
      const reasons = [];
      if (users > 0) reasons.push(`${users} user(s)`);
      if (employees > 0) reasons.push(`${employees} employee(s)`);
      if (orders > 0) reasons.push(`${orders} order(s)`);
      if (invoices > 0) reasons.push(`${invoices} invoice(s)`);
      throw new BadRequestException(
        `Cannot delete business: it has ${reasons.join(', ')}. Please remove all related records first or disable the business instead.`,
      );
    }

    // Delete the business
    await this.prisma.business.delete({
      where: { id },
    });

    // Log deletion activity
    try {
      await this.activityLogsService.create({
        userId: user.userId,
        businessId: id,
        action: 'BUSINESS_DELETED',
        details: JSON.stringify({
          businessName: business.name,
          businessEmail: business.email,
        }),
      });
    } catch (error) {
      // Don't fail deletion if logging fails
      console.error('Failed to log business deletion activity:', error);
    }
  }

  /**
   * Check if a business is active
   */
  async isBusinessActive(businessId: string): Promise<boolean> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { status: true },
    });

    return business?.status === EntityStatus.ACTIVE;
  }

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

  /**
   * Map Prisma business to DTO
   */
  private mapToDto(business: any): BusinessDto {
    return {
      id: business.id,
      name: business.name,
      legalName: business.legalName || undefined,
      email: business.email,
      phone: business.phone || undefined,
      address: business.address || undefined,
      status: business.status as EntityStatus,
      createdAt: business.createdAt.toISOString(),
      updatedAt: business.updatedAt.toISOString(),
    };
  }

  /**
   * Generate a new password for business admin
   */
  async generateNewPassword(
    businessId: string,
    user: TokenPayload,
  ): Promise<{ email: string; temporaryPassword: string }> {
    // Find the business
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Find the business admin user
    const adminUser = await this.prisma.user.findFirst({
      where: {
        businessId: businessId,
        role: UserRole.BUSINESS_ADMIN,
      },
    });

    if (!adminUser) {
      throw new NotFoundException('Business admin user not found');
    }

    // Generate new temporary password
    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword },
    });

    // Log password generation activity
    try {
      await this.activityLogsService.create({
        userId: user.userId,
        businessId: businessId,
        action: 'PASSWORD_RESET',
        details: JSON.stringify({
          adminEmail: adminUser.email,
          resetBy: user.userId,
        }),
      });
    } catch (error) {
      // Don't fail password reset if logging fails
      console.error('Failed to log password reset activity:', error);
    }

    return {
      email: adminUser.email,
      temporaryPassword,
    };
  }

  /**
   * Generate a temporary password
   * Format: 12 characters with letters and numbers
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
