import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole, TokenPayload, EmployeeMenuDto, OrderDto } from '@contracts/core';
import { EmployeeMenuService } from './employee-menu.service';
import { EmployeeOrdersService } from './employee-orders.service';
import { CreateEmployeeOrderDto } from './dto/create-employee-order.dto';

@ApiTags('employee')
@ApiBearerAuth('JWT-auth')
@Controller('employee')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(
    private readonly employeeMenuService: EmployeeMenuService,
    private readonly employeeOrdersService: EmployeeOrdersService,
  ) {}

  @Get('menu')
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get published daily menu for a specific date' })
  @ApiQuery({
    name: 'date',
    description: 'Date in YYYY-MM-DD format',
    example: '2024-01-15',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Published daily menu with available packs, components, and variants',
  })
  @ApiResponse({ status: 404, description: 'No published menu found for the date' })
  @ApiResponse({ status: 403, description: 'Forbidden - EMPLOYEE only' })
  async getMenu(
    @Query('date') date: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<EmployeeMenuDto> {
    return this.employeeMenuService.getMenuByDate(date);
  }

  @Post('orders')
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new order (one per employee per day)' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request (validation failed)' })
  @ApiResponse({ status: 403, description: 'Forbidden - EMPLOYEE only' })
  @ApiResponse({ status: 404, description: 'Daily menu or pack not found' })
  @ApiResponse({ status: 409, description: 'Conflict - duplicate order (one per day)' })
  async createOrder(
    @Body() createOrderDto: CreateEmployeeOrderDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<OrderDto> {
    return this.employeeOrdersService.createOrder(createOrderDto, user);
  }

  @Get('orders/today')
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get today\'s order for the current employee' })
  @ApiResponse({
    status: 200,
    description: 'Today\'s order if exists, otherwise null',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - EMPLOYEE only' })
  async getTodayOrder(
    @CurrentUser() user: TokenPayload,
  ): Promise<OrderDto | null> {
    return this.employeeOrdersService.getTodayOrder(user);
  }
}
