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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PacksService } from './packs.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import {
  PackDto,
  PackWithComponentsDto,
  TokenPayload,
  UserRole,
  CreatePackComponentDto,
  PackComponentDto,
  PackStatisticsDto,
} from '@contracts/core';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';

@ApiTags('packs')
@ApiBearerAuth('JWT-auth')
@Controller('packs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new pack' })
  @ApiResponse({
    status: 201,
    description: 'Pack created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async create(
    @Body() createPackDto: CreatePackDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<PackDto> {
    return this.packsService.create(createPackDto, user);
  }

  @Get()
  @Roles(UserRole.EMPLOYEE, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all packs' })
  @ApiResponse({
    status: 200,
    description: 'List of packs',
  })
  async findAll(@CurrentUser() user?: TokenPayload): Promise<PackDto[]> {
    return this.packsService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a pack by ID with its components' })
  @ApiParam({ name: 'id', description: 'Pack ID' })
  @ApiResponse({
    status: 200,
    description: 'Pack details with components',
  })
  @ApiResponse({ status: 404, description: 'Pack not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: TokenPayload,
  ): Promise<PackWithComponentsDto> {
    return this.packsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a pack' })
  @ApiParam({ name: 'id', description: 'Pack ID' })
  @ApiResponse({
    status: 200,
    description: 'Pack updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Pack not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async update(
    @Param('id') id: string,
    @Body() updatePackDto: UpdatePackDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<PackDto> {
    return this.packsService.update(id, updatePackDto, user);
  }

  @Post(':id/components')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a component to a pack' })
  @ApiParam({ name: 'id', description: 'Pack ID' })
  @ApiResponse({
    status: 201,
    description: 'Component added to pack successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request (component already in pack)' })
  @ApiResponse({ status: 404, description: 'Pack or component not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async addComponent(
    @Param('id') packId: string,
    @Body() createPackComponentDto: CreatePackComponentDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<PackComponentDto> {
    return this.packsService.addComponent(packId, createPackComponentDto, user);
  }

  @Get(':id/components')
  @Roles(UserRole.EMPLOYEE, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get components for a pack' })
  @ApiParam({ name: 'id', description: 'Pack ID' })
  @ApiResponse({
    status: 200,
    description: 'List of pack components',
  })
  @ApiResponse({ status: 404, description: 'Pack not found' })
  async getPackComponents(
    @Param('id') packId: string,
  ): Promise<PackComponentDto[]> {
    return this.packsService.getPackComponents(packId);
  }

  @Delete(':id/components/:componentId')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a component from a pack' })
  @ApiParam({ name: 'id', description: 'Pack ID' })
  @ApiParam({ name: 'componentId', description: 'Component ID' })
  @ApiResponse({
    status: 204,
    description: 'Component removed from pack successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request (pack is part of subscribed service)' })
  @ApiResponse({ status: 404, description: 'Pack or pack component not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async removeComponent(
    @Param('id') packId: string,
    @Param('componentId') componentId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    return this.packsService.removeComponent(packId, componentId, user);
  }

  @Get(':id/statistics')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get statistics for a pack' })
  @ApiParam({ name: 'id', description: 'Pack ID' })
  @ApiResponse({
    status: 200,
    description: 'Pack statistics including order count, revenue, and recent orders',
  })
  @ApiResponse({ status: 404, description: 'Pack not found' })
  async getPackStatistics(@Param('id') packId: string): Promise<PackStatisticsDto> {
    return this.packsService.getPackStatistics(packId);
  }
}
