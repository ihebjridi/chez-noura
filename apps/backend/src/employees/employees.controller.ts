import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, BusinessScopeGuard } from '../auth/guards';
import { Roles, BusinessScoped, CurrentUser } from '../auth/decorators';
import { UserRole, TokenPayload, EmployeeMenuDto, OrderDto, BusinessDto } from '@contracts/core';
import { EmployeeMenuService } from './employee-menu.service';
import { EmployeeOrdersService } from './employee-orders.service';
import { CreateEmployeeOrderDto } from './dto/create-employee-order.dto';
import { BusinessesService } from '../businesses/businesses.service';

@ApiTags('employee')
@ApiBearerAuth('JWT-auth')
@Controller('employee')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
export class EmployeesController {
  constructor(
    private readonly employeeMenuService: EmployeeMenuService,
    private readonly employeeOrdersService: EmployeeOrdersService,
    private readonly businessesService: BusinessesService,
  ) {}

  @Get('menu')
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get daily menu for a specific date (published or unpublished)' })
  @ApiQuery({
    name: 'date',
    description: 'Date in YYYY-MM-DD format',
    example: '2024-01-15',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Daily menu with available packs, components, and variants. Status field indicates if menu is published.',
  })
  @ApiResponse({ status: 404, description: 'No menu found for the date' })
  @ApiResponse({ status: 403, description: 'Forbidden - EMPLOYEE only' })
  async getMenu(
    @Query('date') date: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<EmployeeMenuDto> {
    return this.employeeMenuService.getMenuByDate(date, user);
  }

  @Post('orders')
  @Roles(UserRole.EMPLOYEE)
  @BusinessScoped()
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
  @BusinessScoped()
  @ApiOperation({ summary: 'Get all today\'s orders for the current employee (one per service)' })
  @ApiResponse({
    status: 200,
    description: 'Array of today\'s orders. Can be multiple orders (one per service).',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - EMPLOYEE only' })
  async getTodayOrders(
    @CurrentUser() user: TokenPayload,
  ): Promise<OrderDto[]> {
    const orders = await this.employeeOrdersService.getTodayOrders(user);
    return orders;
  }

  @Get('orders/today/single')
  @Roles(UserRole.EMPLOYEE)
  @BusinessScoped()
  @ApiOperation({ summary: 'Get today\'s first order for the current employee (backward compatibility)' })
  @ApiResponse({
    status: 200,
    description: 'Today\'s first order if exists, otherwise null. Returns OrderDto or null.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - EMPLOYEE only' })
  async getTodayOrder(
    @CurrentUser() user: TokenPayload,
  ): Promise<OrderDto | null> {
    const order = await this.employeeOrdersService.getTodayOrder(user);
    return order;
  }

  @Get('business')
  @Roles(UserRole.EMPLOYEE)
  @BusinessScoped()
  @ApiOperation({ summary: 'Get the employee\'s affiliated business information' })
  @ApiResponse({
    status: 200,
    description: 'Business information',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - EMPLOYEE only' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getMyBusiness(
    @CurrentUser() user: TokenPayload,
  ): Promise<BusinessDto> {
    if (!user.businessId) {
      throw new BadRequestException('Employee is not associated with a business');
    }
    // BusinessScopeGuard ensures user.businessId is valid and matches user's business
    // Service layer will return 404 if business doesn't exist
    return this.businessesService.findOne(user.businessId);
  }
}
