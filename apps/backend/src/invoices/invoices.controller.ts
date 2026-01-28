import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard, RolesGuard, BusinessScopeGuard } from '../auth/guards';
import { Roles, BusinessScoped, CurrentUser } from '../auth/decorators';
import {
  InvoiceDto,
  InvoiceSummaryDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';

@ApiTags('invoices')
@ApiBearerAuth('JWT-auth')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('generate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Generate invoices for a period (idempotent)',
  })
  @ApiQuery({
    name: 'start',
    required: true,
    description: 'Period start date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'end',
    required: true,
    description: 'Period end date (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoices generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 409, description: 'Conflict - invoices already exist' })
  async generateInvoices(
    @Query('start') start: string,
    @Query('end') end: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<InvoiceDto[]> {
    if (!start || !end) {
      throw new BadRequestException(
        'start and end query parameters are required (YYYY-MM-DD)',
      );
    }
    return this.invoicesService.generateInvoices(start, end, user);
  }

  @Post('generate/business/:businessId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Generate draft invoices for a specific business (idempotent)',
    description: 'Generate invoices for a business. If date range is provided, generate for that period. Otherwise, generate for all uninvoiced LOCKED orders.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'Business ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'start',
    required: false,
    description: 'Period start date (YYYY-MM-DD). If not provided, uses earliest order date.',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'end',
    required: false,
    description: 'Period end date (YYYY-MM-DD). If not provided, uses latest order date.',
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 409, description: 'Conflict - invoice already exists' })
  async generateBusinessInvoices(
    @Param('businessId') businessId: string,
    @Query('start') start: string | undefined,
    @Query('end') end: string | undefined,
    @CurrentUser() user: TokenPayload,
  ): Promise<InvoiceDto[]> {
    return this.invoicesService.generateBusinessInvoices(
      businessId,
      start,
      end,
      user,
    );
  }

  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all invoices (admin view)' })
  @ApiResponse({
    status: 200,
    description: 'List of all invoices',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async getAdminInvoices(
    @CurrentUser() user: TokenPayload,
  ): Promise<InvoiceSummaryDto[]> {
    return this.invoicesService.getAdminInvoices(user);
  }

  @Get('business')
  @Roles(UserRole.BUSINESS_ADMIN)
  @BusinessScoped()
  @ApiOperation({ summary: 'Get invoices for current business' })
  @ApiResponse({
    status: 200,
    description: 'List of business invoices',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - BUSINESS_ADMIN only' })
  async getBusinessInvoices(
    @CurrentUser() user: TokenPayload,
  ): Promise<InvoiceSummaryDto[]> {
    return this.invoicesService.getBusinessInvoices(user);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
  @BusinessScoped()
  @ApiOperation({ summary: 'Get invoice by ID (scoped to business for BUSINESS_ADMIN)' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({
    status: 200,
    description: 'Invoice details',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoiceById(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<InvoiceDto> {
    return this.invoicesService.getInvoiceById(id, user);
  }
}
