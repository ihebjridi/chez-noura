import { Controller, Get, UseGuards } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard, RolesGuard, BusinessScopeGuard } from '../auth/guards';
import { Roles, BusinessScoped, CurrentUser } from '../auth/decorators';
import { OrderSummaryDto, TokenPayload, UserRole } from '@contracts/core';

@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get('orders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
  @BusinessScoped()
  async getBusinessOrders(
    @CurrentUser() user: TokenPayload,
  ): Promise<OrderSummaryDto[]> {
    return this.businessesService.getBusinessOrders(user);
  }
}
