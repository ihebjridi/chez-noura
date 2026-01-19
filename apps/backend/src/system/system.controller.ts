import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SystemService } from './system.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@contracts/core';

@ApiTags('system')
@ApiBearerAuth('JWT-auth')
@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_ADMIN)
  @ApiOperation({ summary: 'Get system status' })
  @ApiResponse({
    status: 200,
    description: 'System status retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus() {
    return this.systemService.getStatus();
  }

  @Post('ordering/lock')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually lock ordering for a date' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', example: '2024-01-15' },
      },
      required: ['date'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ordering locked successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async lockOrdering(@Body() body: { date: string }) {
    return this.systemService.lockOrdering(body.date);
  }

  @Post('ordering/unlock')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually unlock ordering for a date' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', example: '2024-01-15' },
      },
      required: ['date'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ordering unlocked successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async unlockOrdering(@Body() body: { date: string }) {
    return this.systemService.unlockOrdering(body.date);
  }
}
