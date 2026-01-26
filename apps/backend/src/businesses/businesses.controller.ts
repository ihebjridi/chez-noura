import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard, RolesGuard, BusinessScopeGuard } from '../auth/guards';
import { Roles, BusinessScoped, CurrentUser } from '../auth/decorators';
import {
  BusinessDto,
  CreateBusinessDto,
  UpdateBusinessDto,
  TokenPayload,
  UserRole,
  OrderSummaryDto,
} from '@contracts/core';
import { CreateBusinessDtoClass } from './dto/create-business.dto';

@ApiTags('businesses')
@ApiBearerAuth('JWT-auth')
@Controller('businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new business with admin user' })
  @ApiResponse({
    status: 201,
    description: 'Business created successfully with admin credentials',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 409, description: 'Conflict - name or email already exists' })
  async create(
    @Body() createBusinessDto: CreateBusinessDtoClass,
    @CurrentUser() user: TokenPayload,
  ): Promise<{
    business: BusinessDto;
    adminCredentials: { email: string; temporaryPassword: string };
  }> {
    return this.businessesService.create(createBusinessDto, user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all businesses (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all businesses',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async findAll(@CurrentUser() user: TokenPayload): Promise<BusinessDto[]> {
    return this.businessesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a business by ID' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'Business details',
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<BusinessDto> {
    return this.businessesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'Business updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 409, description: 'Conflict - name or email already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<BusinessDto> {
    return this.businessesService.update(id, updateBusinessDto);
  }

  @Patch(':id/disable')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable a business (prevents new orders)' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'Business disabled successfully',
  })
  @ApiResponse({ status: 400, description: 'Business already disabled' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async disable(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<BusinessDto> {
    return this.businessesService.disable(id);
  }

  @Post(':id/generate-password')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a new password for business admin' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'New password generated successfully',
  })
  @ApiResponse({ status: 404, description: 'Business or admin user not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async generatePassword(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ email: string; temporaryPassword: string }> {
    return this.businessesService.generateNewPassword(id, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a business (only if no related records exist)' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 204,
    description: 'Business deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot delete: business has related records' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    return this.businessesService.delete(id, user);
  }
}

/**
 * Legacy controller for business orders endpoint
 * Kept for backward compatibility
 */
@ApiTags('business')
@ApiBearerAuth('JWT-auth')
@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
export class BusinessController {
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
