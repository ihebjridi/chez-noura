import {
  Controller,
  Post,
  Get,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OpsService } from './ops.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import {
  KitchenSummaryDto,
  KitchenBusinessSummaryDto,
  DayLockDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';

@ApiTags('ops')
@ApiBearerAuth('JWT-auth')
@Controller('ops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Post('lock-day')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lock all orders for a date (after cutoff)' })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date to lock (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @ApiResponse({
    status: 201,
    description: 'Day locked successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 409, description: 'Conflict - day already locked' })
  async lockDay(
    @Query('date') date: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<DayLockDto> {
    if (!date) {
      throw new BadRequestException('Date query parameter is required');
    }
    return this.opsService.lockDay(date, user);
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get kitchen summary for a date (aggregated by meal)',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date to summarize (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Output format',
    enum: ['json', 'csv'],
    example: 'json',
  })
  @ApiResponse({
    status: 200,
    description: 'Kitchen summary',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async getSummary(
    @Query('date') date: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res() res?: Response,
  ): Promise<KitchenSummaryDto | void> {
    if (!date) {
      throw new BadRequestException('Date query parameter is required');
    }

    const result = await this.opsService.getSummary(date, format);

    if (format === 'csv') {
      if (!res) {
        throw new BadRequestException('Response object required for CSV format');
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="kitchen-summary-${date}.csv"`,
      );
      res.send(result);
      return;
    }

    return result as KitchenSummaryDto;
  }

  @Get('business-summary')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get kitchen summary with business breakdown',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date to summarize (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Output format',
    enum: ['json', 'csv'],
    example: 'json',
  })
  @ApiResponse({
    status: 200,
    description: 'Kitchen summary with business breakdown',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async getBusinessSummary(
    @Query('date') date: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res() res?: Response,
  ): Promise<KitchenBusinessSummaryDto | void> {
    if (!date) {
      throw new BadRequestException('Date query parameter is required');
    }

    const result = await this.opsService.getBusinessSummary(date, format);

    if (format === 'csv') {
      if (!res) {
        throw new BadRequestException('Response object required for CSV format');
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="kitchen-business-summary-${date}.csv"`,
      );
      res.send(result);
      return;
    }

    return result as KitchenBusinessSummaryDto;
  }
}
