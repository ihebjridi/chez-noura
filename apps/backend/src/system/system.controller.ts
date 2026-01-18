import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@contracts/core';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('status')
  async getStatus() {
    return this.systemService.getStatus();
  }

  @Post('ordering/lock')
  @Roles(UserRole.SUPER_ADMIN)
  async lockOrdering(@Body() body: { date: string }) {
    return this.systemService.lockOrdering(body.date);
  }

  @Post('ordering/unlock')
  @Roles(UserRole.SUPER_ADMIN)
  async unlockOrdering(@Body() body: { date: string }) {
    return this.systemService.unlockOrdering(body.date);
  }
}
