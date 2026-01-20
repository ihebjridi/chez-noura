import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
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

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

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

    // Check if business email already exists
    const existingByEmail = await this.prisma.business.findUnique({
      where: { email: createBusinessDto.email },
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
          email: createBusinessDto.email,
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
