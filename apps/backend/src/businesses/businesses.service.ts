import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../common/services/file-storage.service';
import { MailingService } from '../common/services/mailing.service';
import {
  OrderSummaryDto,
  TokenPayload,
  UserRole,
  BusinessDto,
  CreateBusinessDto,
  UpdateBusinessDto,
  EntityStatus,
  EmployeeDto,
  BusinessDashboardSummaryDto,
} from '@contracts/core';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { OrdersService } from '../orders/orders.service';
import { Express } from 'express';

@Injectable()
export class BusinessesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ActivityLogsService))
    private activityLogsService: ActivityLogsService,
    private fileStorageService: FileStorageService,
    private mailingService: MailingService,
    private ordersService: OrdersService,
  ) {}

  /**
   * Create a new business with a BUSINESS_ADMIN user
   * Uses transaction to ensure atomicity
   */
  async create(
    createBusinessDto: CreateBusinessDto,
    user: TokenPayload,
    logoFile?: Express.Multer.File,
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

    // Upload logo if provided
    let logoUrl: string | undefined;
    if (logoFile) {
      const uploadResult = await this.fileStorageService.uploadBusinessLogo(logoFile);
      logoUrl = uploadResult.url;
    }

    // Use transaction to create business and admin user atomically
    // The transaction ensures that both the business and admin user (with password) are
    // created together and committed to the database immediately. If either operation fails,
    // the entire transaction is rolled back, ensuring data consistency.
    // The password is saved immediately and atomically as part of this transaction.
    const result = await this.prisma.$transaction(async (tx) => {
      // Create business
      const business = await tx.business.create({
        data: {
          name: createBusinessDto.name,
          legalName: createBusinessDto.legalName,
          email: businessEmail,
          phone: createBusinessDto.phone,
          address: createBusinessDto.address,
          logoUrl,
          status: EntityStatus.ACTIVE,
        },
      });

      // Create BUSINESS_ADMIN user with password
      // The password is saved immediately and atomically within this transaction
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

    // Send welcome email to business admin
    try {
      await this.mailingService.sendBusinessWelcomeEmail(
        createBusinessDto.adminEmail,
        result.business.name,
        temporaryPassword,
      );
    } catch (error) {
      // Don't fail business creation if email fails
      console.error('Failed to send welcome email:', error);
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
    logoFile?: Express.Multer.File,
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

    // Handle logo upload
    let logoUrl: string | undefined = existing.logoUrl || undefined;
    if (logoFile) {
      // Delete old logo if it exists
      if (existing.logoUrl) {
        await this.fileStorageService.deleteFile(existing.logoUrl);
      }
      // Upload new logo
      const uploadResult = await this.fileStorageService.uploadBusinessLogo(logoFile);
      logoUrl = uploadResult.url;
    } else if (updateBusinessDto.logoUrl === null || updateBusinessDto.logoUrl === '') {
      // Explicitly remove logo if logoUrl is set to null/empty
      if (existing.logoUrl) {
        await this.fileStorageService.deleteFile(existing.logoUrl);
      }
      logoUrl = null;
    } else if (updateBusinessDto.logoUrl !== undefined) {
      logoUrl = updateBusinessDto.logoUrl;
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
          logoUrl,
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
   * Enable a business
   * Re-enables a previously disabled business
   */
  async enable(id: string): Promise<BusinessDto> {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    if (business.status === EntityStatus.ACTIVE) {
      throw new BadRequestException('Business is already enabled');
    }

    const updated = await this.prisma.business.update({
      where: { id },
      data: {
        status: EntityStatus.ACTIVE,
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
   * Get dashboard summary for business portal (one date).
   * Returns active employee count (status ACTIVE), orders for the date, totalOrders, totalCost.
   * Also includes all-time statistics (totalOrdersAllTime, totalCostAllTime).
   */
  async getDashboardSummary(user: TokenPayload, date: string): Promise<BusinessDashboardSummaryDto> {
    if (user.role !== UserRole.BUSINESS_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Only business admins and super admins can access dashboard summary');
    }
    const businessId = user.businessId;
    if (!businessId) {
      throw new BadRequestException('Business ID not found');
    }

    const [activeEmployeesCount, orders, allOrders] = await Promise.all([
      this.prisma.employee.count({
        where: {
          businessId,
          status: EntityStatus.ACTIVE,
        },
      }),
      this.ordersService.getBusinessOrdersByDate(user, date),
      this.ordersService.getBusinessOrders(user),
    ]);

    const totalOrders = orders.length;
    const totalCost = orders.reduce((sum, o) => sum + (typeof o.totalAmount === 'number' ? o.totalAmount : Number(o.totalAmount)), 0);

    const totalOrdersAllTime = allOrders.length;
    const totalCostAllTime = allOrders.reduce((sum, o) => sum + (typeof o.totalAmount === 'number' ? o.totalAmount : Number(o.totalAmount)), 0);

    return {
      date,
      activeEmployeesCount,
      totalOrders,
      totalCost,
      orders,
      totalOrdersAllTime,
      totalCostAllTime,
    };
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
      logoUrl: business.logoUrl || undefined,
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

    // Update password in a transaction to ensure atomicity and immediate persistence
    // The transaction ensures the password is committed to the database before proceeding
    let updatedUser;
    try {
      updatedUser = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: adminUser.id },
          data: { password: hashedPassword },
        });

        // Verify update succeeded - ensure we got a user object back
        if (!user) {
          throw new Error('Failed to update password: user not found after update');
        }

        return user;
      });
    } catch (error) {
      // If database update fails, throw error immediately - don't proceed with logging/email
      console.error('Failed to update password in database:', error);
      throw new BadRequestException(
        'Failed to update password in database. Please try again.',
      );
    }

    // Only proceed with non-critical operations after confirming password was saved
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

    // Send password reset email
    try {
      await this.mailingService.sendPasswordResetEmail(
        adminUser.email,
        temporaryPassword,
      );
    } catch (error) {
      // Don't fail password reset if email fails
      console.error('Failed to send password reset email:', error);
    }

    return {
      email: adminUser.email,
      temporaryPassword,
    };
  }

  /**
   * Get employees for a business by business ID
   * SUPER_ADMIN only - allows viewing employees of any business
   */
  async getEmployeesByBusinessId(businessId: string): Promise<EmployeeDto[]> {
    // Verify business exists
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Get all employees for this business
    const employees = await this.prisma.employee.findMany({
      where: {
        businessId: businessId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return employees.map((employee) => ({
      id: employee.id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      businessId: employee.businessId,
      status: employee.status as EntityStatus,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    }));
  }

  /**
   * Force delete a business and all related records
   * Deletes all related data in a transaction
   * WARNING: This is irreversible and will delete all associated data
   */
  async forceDelete(id: string, user: TokenPayload): Promise<void> {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    // Log the force delete action before deletion
    try {
      await this.activityLogsService.create({
        userId: user.userId,
        businessId: id,
        action: 'BUSINESS_FORCE_DELETED',
        details: JSON.stringify({
          businessName: business.name,
          businessEmail: business.email,
          deletedBy: user.userId,
        }),
      });
    } catch (error) {
      // Don't fail deletion if logging fails
      console.error('Failed to log business force deletion activity:', error);
    }

    // Delete all related records in a transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Delete ActivityLogs (set businessId to null via onDelete: SetNull, but we'll delete them)
      await tx.activityLog.deleteMany({
        where: { businessId: id },
      });

      // 2. Delete InvoiceItems (via Invoice)
      const invoices = await tx.invoice.findMany({
        where: { businessId: id },
        select: { id: true },
      });
      const invoiceIds = invoices.map((inv) => inv.id);
      if (invoiceIds.length > 0) {
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: { in: invoiceIds } },
        });
      }

      // 3. Delete Invoices
      await tx.invoice.deleteMany({
        where: { businessId: id },
      });

      // 4. Delete OrderItems (via Order)
      const orders = await tx.order.findMany({
        where: { businessId: id },
        select: { id: true },
      });
      const orderIds = orders.map((ord) => ord.id);
      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: { orderId: { in: orderIds } },
        });
      }

      // 5. Delete Orders
      await tx.order.deleteMany({
        where: { businessId: id },
      });

      // 6. Delete Users associated with this business
      await tx.user.deleteMany({
        where: { businessId: id },
      });

      // 7. Delete Employees
      await tx.employee.deleteMany({
        where: { businessId: id },
      });

      // 8. Delete Business
      await tx.business.delete({
        where: { id },
      });
    });
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
