import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
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
  CreateDailyMenuDto,
  AddPackToDailyMenuDto,
  AddVariantToDailyMenuDto,
  PublishDailyMenuResponseDto,
} from '@contracts/core';
import { CreateDailyMenuValidationDto } from './dto/create-daily-menu.dto';
import { AddPackToDailyMenuValidationDto } from './dto/add-pack-to-daily-menu.dto';
import { AddVariantToDailyMenuValidationDto } from './dto/add-variant-to-daily-menu.dto';

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
  @ApiOperation({ summary: 'Get all daily menus' })
  @ApiResponse({
    status: 200,
    description: 'List of daily menus',
  })
  async findAll(): Promise<DailyMenuDto[]> {
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
    return this.dailyMenusService.addVariant(id, addVariantDto);
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
}
