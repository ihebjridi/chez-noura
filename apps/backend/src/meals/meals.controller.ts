import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MealsService } from './meals.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { MealDto, TokenPayload, UserRole } from '@contracts/core';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';

@ApiTags('meals')
@ApiBearerAuth('JWT-auth')
@Controller('meals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new meal' })
  @ApiResponse({
    status: 201,
    description: 'Meal created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async create(
    @Body() createMealDto: CreateMealDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<MealDto> {
    return this.mealsService.create(createMealDto, user);
  }

  @Get()
  @Roles(UserRole.EMPLOYEE, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get meals (optionally filtered by date)' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter by date (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @ApiResponse({
    status: 200,
    description: 'List of meals',
  })
  @ApiResponse({ status: 400, description: 'Invalid date format' })
  async findAll(
    @Query('date') date?: string,
    @CurrentUser() user?: TokenPayload,
  ): Promise<MealDto[]> {
    return this.mealsService.findAll(date, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a meal' })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({
    status: 200,
    description: 'Meal updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async update(
    @Param('id') id: string,
    @Body() updateMealDto: UpdateMealDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<MealDto> {
    return this.mealsService.update(id, updateMealDto, user);
  }
}
