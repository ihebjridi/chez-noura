import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { OrderDto, TokenPayload, UserRole } from '@contracts/core';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: TokenPayload,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<OrderDto> {
    return this.ordersService.createOrder(createOrderDto, user, idempotencyKey);
  }
}
