import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MealDto, TokenPayload, UserRole } from '@contracts/core';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MealsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new meal
   * Only SUPER_ADMIN can create meals
   */
  async create(createMealDto: CreateMealDto, user: TokenPayload): Promise<MealDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can create meals');
    }

    // Validate availableDate is a valid date
    const availableDate = new Date(createMealDto.availableDate);
    if (isNaN(availableDate.getTime())) {
      throw new BadRequestException('Invalid availableDate format');
    }

    // Set cutoffTime to end of day if not provided (default cutoff)
    // For now, we'll set it to 12:00 PM on the available date as a default
    const cutoffTime = new Date(availableDate);
    cutoffTime.setHours(12, 0, 0, 0);

    const meal = await this.prisma.meal.create({
      data: {
        name: createMealDto.name,
        description: createMealDto.description,
        price: createMealDto.price,
        availableDate: availableDate,
        cutoffTime: cutoffTime,
        isActive: true,
        status: 'ACTIVE',
      },
    });

    return this.mapMealToDto(meal);
  }

  /**
   * Find all meals, optionally filtered by date
   * EMPLOYEE and BUSINESS_ADMIN can view meals
   */
  async findAll(
    date?: string,
    user?: TokenPayload,
  ): Promise<MealDto[]> {
    const where: Prisma.MealWhereInput = {};

    if (date) {
      const filterDate = new Date(date);
      if (isNaN(filterDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }

      const startOfDay = new Date(filterDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filterDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.availableDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Only show active meals to EMPLOYEE and BUSINESS_ADMIN
    if (user && user.role !== UserRole.SUPER_ADMIN) {
      where.isActive = true;
      where.status = 'ACTIVE';
    }

    const meals = await this.prisma.meal.findMany({
      where,
      orderBy: {
        availableDate: 'desc',
      },
    });

    return meals.map((meal) => this.mapMealToDto(meal));
  }

  /**
   * Update a meal
   * Only SUPER_ADMIN can update meals
   */
  async update(
    id: string,
    updateMealDto: UpdateMealDto,
    user: TokenPayload,
  ): Promise<MealDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can update meals');
    }

    const existingMeal = await this.prisma.meal.findUnique({
      where: { id },
    });

    if (!existingMeal) {
      throw new NotFoundException(`Meal with ID ${id} not found`);
    }

    const updateData: Prisma.MealUpdateInput = {};

    if (updateMealDto.name !== undefined) {
      updateData.name = updateMealDto.name;
    }

    if (updateMealDto.description !== undefined) {
      updateData.description = updateMealDto.description;
    }

    if (updateMealDto.price !== undefined) {
      updateData.price = updateMealDto.price;
    }

    if (updateMealDto.availableDate !== undefined) {
      const availableDate = new Date(updateMealDto.availableDate);
      if (isNaN(availableDate.getTime())) {
        throw new BadRequestException('Invalid availableDate format');
      }
      updateData.availableDate = availableDate;
    }

    if (updateMealDto.isActive !== undefined) {
      updateData.isActive = updateMealDto.isActive;
    }

    if (updateMealDto.status !== undefined) {
      updateData.status = updateMealDto.status;
    }

    const updatedMeal = await this.prisma.meal.update({
      where: { id },
      data: updateData,
    });

    return this.mapMealToDto(updatedMeal);
  }

  private mapMealToDto(meal: any): MealDto {
    return {
      id: meal.id,
      name: meal.name,
      description: meal.description || undefined,
      price: Number(meal.price),
      availableDate: meal.availableDate.toISOString().split('T')[0],
      isActive: meal.isActive,
      status: meal.status,
      createdAt: meal.createdAt.toISOString(),
      updatedAt: meal.updatedAt.toISOString(),
    };
  }
}
