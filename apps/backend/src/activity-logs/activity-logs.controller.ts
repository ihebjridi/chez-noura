import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import {
  ActivityLogDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';

@ApiTags('activity-logs')
@ApiBearerAuth('JWT-auth')
@Controller('activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get('business/:businessId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get activity logs for a business (SUPER_ADMIN only)' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of logs to return (default: 100)' })
  @ApiResponse({
    status: 200,
    description: 'List of activity logs for the business',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getBusinessActivityLogs(
    @Param('businessId') businessId: string,
    @Query('limit') limit?: number,
    @CurrentUser() user?: TokenPayload,
  ): Promise<ActivityLogDto[]> {
    const limitValue = limit ? parseInt(limit.toString(), 10) : 100;
    return this.activityLogsService.findByBusiness(businessId, limitValue);
  }
}
