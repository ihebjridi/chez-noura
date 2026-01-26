import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard, RolesGuard, BusinessScopeGuard } from '../auth/guards';
import { Roles, BusinessScoped, CurrentUser } from '../auth/decorators';
import { OrderDto, TokenPayload, UserRole } from '@contracts/core';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE)
  @BusinessScoped()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Create a new order (idempotent)' })
  @ApiHeader({
    name: 'x-idempotency-key',
    required: false,
    description: 'Idempotency key for duplicate prevention',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request (cutoff passed, day locked, etc.)' })
  @ApiResponse({ status: 403, description: 'Forbidden - EMPLOYEE only' })
  @ApiResponse({ status: 409, description: 'Conflict - duplicate order' })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: TokenPayload,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<OrderDto> {
    return this.ordersService.createOrder(createOrderDto, user, idempotencyKey);
  }

  @Get('me')
  @Roles(UserRole.EMPLOYEE)
  @BusinessScoped()
  @ApiOperation({ summary: 'Get current employee orders' })
  @ApiResponse({
    status: 200,
    description: 'List of employee orders',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - EMPLOYEE only' })
  async getMyOrders(@CurrentUser() user: TokenPayload): Promise<OrderDto[]> {
    return this.ordersService.getMyOrders(user);
  }

  @Get('business')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @BusinessScoped()
  @ApiOperation({ summary: 'Get business orders (scoped to user business)' })
  @ApiResponse({
    status: 200,
    description: 'List of business orders',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getBusinessOrders(
    @CurrentUser() user: TokenPayload,
  ): Promise<OrderDto[]> {
    return this.ordersService.getBusinessOrders(user);
  }

  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all orders (admin view)' })
  @ApiResponse({
    status: 200,
    description: 'List of all orders',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async getAdminOrders(@CurrentUser() user: TokenPayload): Promise<OrderDto[]> {
    return this.ordersService.getAdminOrders(user);
  }
}
