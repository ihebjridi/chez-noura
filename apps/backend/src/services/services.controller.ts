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
import { ServicesService } from './services.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import {
  ServiceDto,
  ServiceWithPacksDto,
  ServicePackDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiTags('services')
@ApiBearerAuth('JWT-auth')
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<ServiceDto> {
    return this.servicesService.create(createServiceDto, user);
  }

  @Get()
  @Roles(UserRole.EMPLOYEE, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({
    status: 200,
    description: 'List of services',
  })
  async findAll(@CurrentUser() user?: TokenPayload): Promise<ServiceDto[]> {
    return this.servicesService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a service by ID with its packs' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({
    status: 200,
    description: 'Service details with packs',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: TokenPayload,
  ): Promise<ServiceWithPacksDto> {
    return this.servicesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<ServiceDto> {
    return this.servicesService.update(id, updateServiceDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({
    status: 204,
    description: 'Service deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    return this.servicesService.delete(id, user);
  }

  @Post(':id/packs/:packId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a pack to a service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiParam({ name: 'packId', description: 'Pack ID' })
  @ApiResponse({
    status: 201,
    description: 'Pack added to service successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request (pack already in service or belongs to another service)' })
  @ApiResponse({ status: 404, description: 'Service or pack not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async addPack(
    @Param('id') serviceId: string,
    @Param('packId') packId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ServicePackDto> {
    return this.servicesService.addPack(serviceId, packId, user);
  }

  @Delete(':id/packs/:packId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove a pack from a service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiParam({ name: 'packId', description: 'Pack ID' })
  @ApiResponse({
    status: 200,
    description: 'Pack removed from service successfully',
  })
  @ApiResponse({ status: 404, description: 'Service pack not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async removePack(
    @Param('id') serviceId: string,
    @Param('packId') packId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    return this.servicesService.removePack(serviceId, packId, user);
  }
}
