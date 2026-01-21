import {
  Controller,
  Get,
  Post,
  Patch,
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
import { JwtAuthGuard, RolesGuard, BusinessScopeGuard } from '../auth/guards';
import { Roles, BusinessScoped, CurrentUser } from '../auth/decorators';
import {
  EmployeeDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';
import { EmployeeManagementService } from './employee-management.service';
import { CreateBusinessEmployeeDto } from './dto/create-business-employee.dto';
import { UpdateBusinessEmployeeDto } from './dto/update-business-employee.dto';

@ApiTags('business')
@ApiBearerAuth('JWT-auth')
@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
export class BusinessEmployeesController {
  constructor(
    private readonly employeeManagementService: EmployeeManagementService,
  ) {}

  @Get('employees')
  @Roles(UserRole.BUSINESS_ADMIN)
  @BusinessScoped()
  @ApiOperation({
    summary: 'List employees for the authenticated business',
  })
  @ApiResponse({
    status: 200,
    description: 'List of employees',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - BUSINESS_ADMIN only' })
  async listEmployees(
    @CurrentUser() user: TokenPayload,
  ): Promise<EmployeeDto[]> {
    return this.employeeManagementService.listEmployees(user);
  }

  @Post('employees')
  @Roles(UserRole.BUSINESS_ADMIN)
  @BusinessScoped()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new employee for the authenticated business',
  })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - BUSINESS_ADMIN only' })
  @ApiResponse({ status: 409, description: 'Conflict - duplicate email' })
  async createEmployee(
    @Body() createDto: CreateBusinessEmployeeDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<EmployeeDto> {
    return this.employeeManagementService.createEmployee(createDto, user);
  }

  @Patch('employees/:id')
  @Roles(UserRole.BUSINESS_ADMIN)
  @BusinessScoped()
  @ApiOperation({
    summary: 'Update an employee (scoped to user business)',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - BUSINESS_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async updateEmployee(
    @Param('id') id: string,
    @Body() updateDto: UpdateBusinessEmployeeDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<EmployeeDto> {
    return this.employeeManagementService.updateEmployee(id, updateDto, user);
  }
}
