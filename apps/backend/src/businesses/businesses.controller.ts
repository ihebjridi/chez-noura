import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard, RolesGuard, BusinessScopeGuard } from '../auth/guards';
import { Roles, BusinessScoped, CurrentUser } from '../auth/decorators';
import { OrderSummaryDto, TokenPayload, UserRole } from '@contracts/core';

@ApiTags('businesses')
@ApiBearerAuth('JWT-auth')
@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get('orders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
  @BusinessScoped()
  @ApiOperation({
    summary: 'Get business orders (scoped to user business)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of business orders',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getBusinessOrders(
    @CurrentUser() user: TokenPayload,
  ): Promise<OrderSummaryDto[]> {
    return this.businessesService.getBusinessOrders(user);
  }
}
