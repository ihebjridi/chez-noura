import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
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
  EmployeeDto,
  UpdateEmployeeDto,
  BusinessDashboardSummaryDto,
} from '@contracts/core';
import { CreateBusinessDtoClass } from './dto/create-business.dto';
import { SetBusinessPasswordDto } from './dto/set-business-password.dto';

@ApiTags('businesses')
@ApiBearerAuth('JWT-auth')
@Controller('businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
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
    @UploadedFile() logoFile?: Express.Multer.File,
  ): Promise<{
    business: BusinessDto;
    adminCredentials: { email: string; temporaryPassword: string };
  }> {
    return this.businessesService.create(createBusinessDto, user, logoFile);
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
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
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
    @UploadedFile() logoFile?: Express.Multer.File,
  ): Promise<BusinessDto> {
    return this.businessesService.update(id, updateBusinessDto, logoFile);
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

  @Patch(':id/enable')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable a business (re-enables a disabled business)' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'Business enabled successfully',
  })
  @ApiResponse({ status: 400, description: 'Business already enabled' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async enable(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<BusinessDto> {
    return this.businessesService.enable(id);
  }

  @Get(':id/employees')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all employees for a business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'List of employees for the business',
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async getEmployees(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<EmployeeDto[]> {
    return this.businessesService.getEmployeesByBusinessId(id);
  }

  @Patch(':id/employees/:employeeId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an employee for a business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Business or employee not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async updateEmployee(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Body() updateDto: UpdateEmployeeDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<EmployeeDto> {
    return this.businessesService.updateBusinessEmployee(id, employeeId, updateDto);
  }

  @Delete(':id/employees/:employeeId')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an employee from a business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({
    status: 204,
    description: 'Employee deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Business or employee not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async deleteEmployee(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    return this.businessesService.deleteBusinessEmployee(id, employeeId, user);
  }

  @Get(':id/temporary-access')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get temporary access status for business admin' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'Temporary access status',
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async getTemporaryAccess(
    @Param('id') id: string,
  ): Promise<{ hasTemporaryPassword: boolean; expiresAt?: string }> {
    return this.businessesService.getTemporaryAccessStatus(id);
  }

  @Post(':id/generate-password')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate a temporary password for investigation (does not change real password)',
  })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'Temporary password generated; valid until expiresAt',
  })
  @ApiResponse({ status: 404, description: 'Business or admin user not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async generatePassword(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ email: string; temporaryPassword: string; expiresAt: string }> {
    return this.businessesService.generateNewPassword(id, user);
  }

  @Post(':id/clear-temporary-password')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear temporary password; real password is unchanged' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 204,
    description: 'Temporary password cleared',
  })
  @ApiResponse({ status: 404, description: 'Business or admin user not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async clearTemporaryPassword(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    return this.businessesService.clearTemporaryPassword(id, user);
  }

  @Patch(':id/password')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Set business admin password to a specific value' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'Password set successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid password (e.g. too short)' })
  @ApiResponse({ status: 404, description: 'Business or admin user not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async setPassword(
    @Param('id') id: string,
    @Body() dto: SetBusinessPasswordDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ email: string }> {
    return this.businessesService.setBusinessAdminPassword(id, dto.newPassword, user);
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

  @Delete(':id/force')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Force delete a business and all related records (irreversible)' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({
    status: 204,
    description: 'Business and all related records deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async forceDelete(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    return this.businessesService.forceDelete(id, user);
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

  @Get('me')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
  @BusinessScoped()
  @ApiOperation({ summary: 'Get the authenticated business admin\'s business' })
  @ApiResponse({ status: 200, description: 'Business details' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getMyBusiness(@CurrentUser() user: TokenPayload): Promise<BusinessDto> {
    if (!user.businessId) {
      throw new BadRequestException('Not associated with a business');
    }
    return this.businessesService.findOne(user.businessId);
  }

  @Get('dashboard/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
  @BusinessScoped()
  @ApiOperation({
    summary: 'Get dashboard summary for business portal (orders for date, active employee count)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary for the given date',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDashboardSummary(
    @CurrentUser() user: TokenPayload,
    @Query('date') date?: string,
  ): Promise<BusinessDashboardSummaryDto> {
    const dateStr =
      date && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : new Date().toISOString().split('T')[0];
    return this.businessesService.getDashboardSummary(user, dateStr);
  }

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
