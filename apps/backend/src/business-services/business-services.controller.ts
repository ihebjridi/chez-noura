import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BusinessServicesService } from './business-services.service';
import { JwtAuthGuard, RolesGuard, BusinessScopeGuard } from '../auth/guards';
import { Roles, BusinessScoped, CurrentUser } from '../auth/decorators';
import {
  BusinessServiceDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';
import { ActivateServiceDtoClass } from './dto/activate-service.dto';
import { UpdateBusinessServiceDtoClass } from './dto/update-business-service.dto';

@ApiTags('business-services')
@ApiBearerAuth('JWT-auth')
@Controller('businesses/:businessId/services')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
export class BusinessServicesController {
  constructor(private readonly businessServicesService: BusinessServicesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @BusinessScoped()
  @ApiOperation({ summary: 'Activate a service for a business (SUPER_ADMIN only)' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiResponse({
    status: 201,
    description: 'Service activated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business or service not found' })
  async activateService(
    @Param('businessId') businessId: string,
    @Body() dto: ActivateServiceDtoClass,
    @CurrentUser() user: TokenPayload,
  ): Promise<BusinessServiceDto> {
    return this.businessServicesService.activateService(businessId, dto, user);
  }

  @Patch(':serviceId')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @BusinessScoped()
  @ApiOperation({ summary: 'Update a service activation for a business' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiResponse({
    status: 200,
    description: 'Service activation updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business service not found' })
  async updateService(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateBusinessServiceDtoClass,
    @CurrentUser() user: TokenPayload,
  ): Promise<BusinessServiceDto> {
    return this.businessServicesService.updateService(businessId, serviceId, dto, user);
  }

  @Delete(':serviceId')
  @Roles(UserRole.SUPER_ADMIN)
  @BusinessScoped()
  @ApiOperation({ summary: 'Deactivate a service for a business (SUPER_ADMIN only)' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiResponse({
    status: 200,
    description: 'Service deactivated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business service not found' })
  async deactivateService(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    return this.businessServicesService.deactivateService(businessId, serviceId, user);
  }

  @Get()
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @BusinessScoped()
  @ApiOperation({ summary: 'Get all activated services for a business' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'List of activated services',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getBusinessServices(
    @Param('businessId') businessId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<BusinessServiceDto[]> {
    return this.businessServicesService.getBusinessServices(businessId, user);
  }

  @Get(':serviceId')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @BusinessScoped()
  @ApiOperation({ summary: 'Get a specific service activation for a business' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiResponse({
    status: 200,
    description: 'Service activation details',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business service not found' })
  async getBusinessService(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<BusinessServiceDto> {
    return this.businessServicesService.getBusinessService(businessId, serviceId, user);
  }
}
