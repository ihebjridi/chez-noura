import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DailyMenusService } from './daily-menus.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '@contracts/core';
import {
  DailyMenuDto,
  DailyMenuWithDetailsDto,
  DailyMenuPackDto,
  DailyMenuVariantDto,
  DailyMenuServiceDto,
  DailyMenuServiceVariantDto,
  CreateDailyMenuDto,
  AddPackToDailyMenuDto,
  AddVariantToDailyMenuDto,
  AddServiceToDailyMenuDto,
  AddVariantToDailyMenuServiceDto,
  PublishDailyMenuResponseDto,
} from '@contracts/core';
import { CreateDailyMenuValidationDto } from './dto/create-daily-menu.dto';
import { AddPackToDailyMenuValidationDto } from './dto/add-pack-to-daily-menu.dto';
import { AddVariantToDailyMenuValidationDto } from './dto/add-variant-to-daily-menu.dto';
import { AddServiceToDailyMenuValidationDto } from './dto/add-service-to-daily-menu.dto';
import { AddVariantToDailyMenuServiceValidationDto } from './dto/add-variant-to-daily-menu-service.dto';
import { UpdateCutoffHourValidationDto } from './dto/update-cutoff-hour.dto';

@ApiTags('daily-menus')
@ApiBearerAuth('JWT-auth')
@Controller('daily-menus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyMenusController {
  constructor(private readonly dailyMenusService: DailyMenusService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new daily menu (DRAFT)' })
  @ApiResponse({
    status: 201,
    description: 'Daily menu created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async create(
    @Body() createDto: CreateDailyMenuValidationDto,
  ): Promise<DailyMenuDto> {
    return this.dailyMenusService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all daily menus or a specific menu by date' })
  @ApiQuery({
    name: 'date',
    description: 'Optional date in YYYY-MM-DD format to get a specific menu with details',
    required: false,
    example: '2024-01-15',
  })
  @ApiResponse({
    status: 200,
    description: 'List of daily menus (or array with single menu with details if date provided)',
  })
  async findAll(@Query('date') date?: string): Promise<DailyMenuDto[] | DailyMenuWithDetailsDto[]> {
    if (date) {
      const menu = await this.dailyMenusService.findByDate(date);
      return menu ? [menu] : [];
    }
    return this.dailyMenusService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get daily menu by ID with details' })
  @ApiResponse({
    status: 200,
    description: 'Daily menu details',
  })
  @ApiResponse({ status: 404, description: 'Daily menu not found' })
  async findOne(@Param('id') id: string): Promise<DailyMenuWithDetailsDto> {
    return this.dailyMenusService.findOne(id);
  }

  @Post(':id/packs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a pack to daily menu' })
  @ApiResponse({
    status: 201,
    description: 'Pack added to daily menu',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Daily menu or pack not found' })
  async addPack(
    @Param('id') id: string,
    @Body() addPackDto: AddPackToDailyMenuValidationDto,
  ): Promise<DailyMenuPackDto> {
    return this.dailyMenusService.addPack(id, addPackDto);
  }

  @Post(':id/variants')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a variant to daily menu with initial stock' })
  @ApiResponse({
    status: 201,
    description: 'Variant added to daily menu',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Daily menu or variant not found' })
  async addVariant(
    @Param('id') id: string,
    @Body() addVariantDto: AddVariantToDailyMenuValidationDto,
  ): Promise<DailyMenuVariantDto> {
    return this.dailyMenusService.addVariant(id, addVariantDto as AddVariantToDailyMenuDto);
  }

  @Delete(':id/variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove a variant from daily menu (DRAFT only)' })
  @ApiResponse({
    status: 204,
    description: 'Variant removed from daily menu successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Only DRAFT menus allow variant removal' })
  @ApiResponse({ status: 404, description: 'Daily menu or variant not found' })
  async removeVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ): Promise<void> {
    return this.dailyMenusService.removeVariant(id, variantId);
  }

  @Post(':id/publish')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Publish a daily menu (DRAFT -> PUBLISHED)' })
  @ApiResponse({
    status: 200,
    description: 'Daily menu published successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Daily menu not found' })
  async publish(@Param('id') id: string): Promise<PublishDailyMenuResponseDto> {
    return this.dailyMenusService.publish(id);
  }

  @Post(':id/lock')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lock a daily menu (PUBLISHED -> LOCKED)' })
  @ApiResponse({
    status: 200,
    description: 'Daily menu locked successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Daily menu not found' })
  async lock(@Param('id') id: string): Promise<DailyMenuDto> {
    return this.dailyMenusService.lock(id);
  }

  @Post(':id/unlock')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Unlock a daily menu (LOCKED -> PUBLISHED)' })
  @ApiResponse({
    status: 200,
    description: 'Daily menu unlocked successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Only LOCKED menus can be unlocked' })
  @ApiResponse({ status: 404, description: 'Daily menu not found' })
  async unlock(@Param('id') id: string): Promise<DailyMenuDto> {
    return this.dailyMenusService.unlock(id);
  }

  @Post(':id/unpublish')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Unpublish a daily menu (PUBLISHED -> DRAFT)' })
  @ApiResponse({
    status: 200,
    description: 'Daily menu reset to draft successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Only PUBLISHED menus can be unpublished' })
  @ApiResponse({ status: 404, description: 'Daily menu not found' })
  async unpublish(@Param('id') id: string): Promise<DailyMenuDto> {
    return this.dailyMenusService.unpublish(id);
  }

  @Patch(':id/cutoff-hour')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update cutoff hour for a daily menu' })
  @ApiResponse({
    status: 200,
    description: 'Cutoff hour updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid format or menu is LOCKED' })
  @ApiResponse({ status: 404, description: 'Daily menu not found' })
  async updateCutoffHour(
    @Param('id') id: string,
    @Body() updateDto: UpdateCutoffHourValidationDto,
  ): Promise<DailyMenuDto> {
    return this.dailyMenusService.updateCutoffHour(id, updateDto.cutoffHour);
  }

  @Post(':id/services')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a service to daily menu (automatically adds all packs from the service)' })
  @ApiResponse({
    status: 201,
    description: 'Service added to daily menu',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Daily menu or service not found' })
  async addService(
    @Param('id') id: string,
    @Body() addServiceDto: AddServiceToDailyMenuValidationDto,
  ): Promise<DailyMenuServiceDto> {
    return this.dailyMenusService.addService(id, addServiceDto);
  }

  @Delete(':id/services/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove a service from daily menu (DRAFT only, removes all packs and variants)' })
  @ApiResponse({
    status: 204,
    description: 'Service removed from daily menu successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Only DRAFT menus allow service removal' })
  @ApiResponse({ status: 404, description: 'Daily menu or service not found' })
  async removeService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ): Promise<void> {
    return this.dailyMenusService.removeService(id, serviceId);
  }

  @Post(':id/services/:serviceId/variants')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a variant to a service in daily menu (applies to all packs in the service)' })
  @ApiResponse({
    status: 201,
    description: 'Variant added to service in daily menu',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Daily menu, service, or variant not found' })
  async addServiceVariant(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
    @Body() addVariantDto: AddVariantToDailyMenuServiceValidationDto,
  ): Promise<DailyMenuServiceVariantDto> {
    return this.dailyMenusService.addServiceVariant(id, serviceId, addVariantDto);
  }

  @Delete(':id/services/:serviceId/variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove a variant from a service in daily menu (DRAFT only)' })
  @ApiResponse({
    status: 204,
    description: 'Variant removed from service in daily menu successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Only DRAFT menus allow variant removal' })
  @ApiResponse({ status: 404, description: 'Daily menu, service, or variant not found' })
  async removeServiceVariant(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
    @Param('variantId') variantId: string,
  ): Promise<void> {
    return this.dailyMenusService.removeServiceVariant(id, serviceId, variantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a daily menu (DRAFT only, or with orders when withOrders=true for dev)' })
  @ApiQuery({ name: 'withOrders', required: false, description: 'If true, delete related orders then the menu (dev only); allows any status' })
  @ApiResponse({
    status: 204,
    description: 'Daily menu deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Only DRAFT menus can be deleted' })
  @ApiResponse({ status: 404, description: 'Daily menu not found' })
  async delete(
    @Param('id') id: string,
    @Query('withOrders') withOrders?: string,
  ): Promise<void> {
    const deleteWithOrders = withOrders === 'true';
    return this.dailyMenusService.delete(id, deleteWithOrders);
  }
}
