import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EmployeeDto,
  TokenPayload,
  UserRole,
  EntityStatus,
} from '@contracts/core';
import { CreateBusinessEmployeeDto } from './dto/create-business-employee.dto';
import { UpdateBusinessEmployeeDto } from './dto/update-business-employee.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmployeeManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all employees for the authenticated business
   * Business isolation enforced at query level
   */
  async listEmployees(user: TokenPayload): Promise<EmployeeDto[]> {
    if (!user.businessId) {
      throw new ForbiddenException('User does not belong to a business');
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        businessId: user.businessId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return employees.map((employee) => this.mapToDto(employee));
  }

  /**
   * Create a new employee for the authenticated business
   * Creates Employee and User account with EMPLOYEE role
   * Prevents duplicate emails
   */
  async createEmployee(
    createDto: CreateBusinessEmployeeDto,
    user: TokenPayload,
  ): Promise<EmployeeDto> {
    if (!user.businessId) {
      throw new ForbiddenException('User does not belong to a business');
    }

    // Verify business exists and is active
    const business = await this.prisma.business.findUnique({
      where: { id: user.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.status !== EntityStatus.ACTIVE) {
      throw new BadRequestException('Business is not active');
    }

    // Check for duplicate email (globally unique per schema)
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: createDto.email },
    });

    if (existingEmployee) {
      throw new ConflictException(
        `Employee with email ${createDto.email} already exists`,
      );
    }

    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email ${createDto.email} already exists`,
      );
    }

    // Create employee and user account in a transaction
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Create employee
        const employee = await tx.employee.create({
          data: {
            email: createDto.email,
            firstName: createDto.firstName,
            lastName: createDto.lastName,
            businessId: user.businessId,
            status: EntityStatus.ACTIVE,
          },
        });

        // Create user account with EMPLOYEE role (no password for email-based auth)
        await tx.user.create({
          data: {
            email: createDto.email,
            password: null, // Email-based auth for employees
            role: UserRole.EMPLOYEE,
            businessId: user.businessId,
            employeeId: employee.id,
          },
        });

        return employee;
      });

      return this.mapToDto(result);
    } catch (error) {
      // Handle unique constraint violations
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Employee with email ${createDto.email} already exists`,
        );
      }
      throw error;
    }
  }

  /**
   * Update an employee
   * Business isolation enforced - only employees of the user's business can be updated
   * Returns 404 if employee doesn't belong to business
   */
  async updateEmployee(
    employeeId: string,
    updateDto: UpdateBusinessEmployeeDto,
    user: TokenPayload,
  ): Promise<EmployeeDto> {
    if (!user.businessId) {
      throw new ForbiddenException('User does not belong to a business');
    }

    // Find employee and verify it belongs to the user's business
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Enforce business isolation
    if (employee.businessId !== user.businessId) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Build update data
    const updateData: Prisma.EmployeeUpdateInput = {};

    if (updateDto.firstName !== undefined) {
      updateData.firstName = updateDto.firstName;
    }

    if (updateDto.lastName !== undefined) {
      updateData.lastName = updateDto.lastName;
    }

    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status as any;
    }

    // Update employee
    const updatedEmployee = await this.prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
    });

    return this.mapToDto(updatedEmployee);
  }

  private mapToDto(employee: any): EmployeeDto {
    return {
      id: employee.id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      businessId: employee.businessId,
      status: employee.status as EntityStatus,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    };
  }
}
