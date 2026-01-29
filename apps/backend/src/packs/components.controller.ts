import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { ComponentsService } from './components.service';
import { PacksService } from './packs.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import {
  ComponentDto,
  VariantDto,
  TokenPayload,
  UserRole,
  ComponentStatisticsDto,
  ComponentPackUsageDto,
} from '@contracts/core';
import { CreateComponentDtoClass } from './dto/create-component.dto';
import { UpdateComponentDtoClass } from './dto/update-component.dto';
import { CreateVariantDtoClass } from './dto/create-variant.dto';
import { UpdateVariantDtoClass } from './dto/update-variant.dto';

@ApiTags('components')
@ApiBearerAuth('JWT-auth')
@Controller('components')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComponentsController {
  constructor(
    private readonly componentsService: ComponentsService,
    private readonly packsService: PacksService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new component' })
  @ApiResponse({
    status: 201,
    description: 'Component created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async createComponent(
    @Body() createComponentDto: CreateComponentDtoClass,
    @CurrentUser() user: TokenPayload,
  ): Promise<ComponentDto> {
    return this.componentsService.createComponent(createComponentDto, user);
  }

  @Get()
  @Roles(UserRole.EMPLOYEE, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all components' })
  @ApiResponse({
    status: 200,
    description: 'List of components',
  })
  async findAllComponents(): Promise<ComponentDto[]> {
    return this.componentsService.findAllComponents();
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a component' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({
    status: 200,
    description: 'Component updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async updateComponent(
    @Param('id') componentId: string,
    @Body() updateComponentDto: UpdateComponentDtoClass,
    @CurrentUser() user: TokenPayload,
  ): Promise<ComponentDto> {
    return this.componentsService.updateComponent(componentId, updateComponentDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a component' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({
    status: 204,
    description: 'Component deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot delete: component is referenced by order items' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async deleteComponent(
    @Param('id') componentId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    return this.componentsService.deleteComponent(componentId, user);
  }

  @Post(':id/variants')
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a variant for a component' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({
    status: 201,
    description: 'Variant created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request (duplicate variant name)' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async createVariant(
    @Param('id') componentId: string,
    @Body() createVariantDto: CreateVariantDtoClass,
    @CurrentUser() user: TokenPayload,
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<VariantDto> {
    return this.componentsService.createVariant(componentId, createVariantDto, user, imageFile);
  }

  @Get(':id/variants')
  @Roles(UserRole.EMPLOYEE, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all variants for a component' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({
    status: 200,
    description: 'List of variants for the component',
  })
  @ApiResponse({ status: 404, description: 'Component not found' })
  async getComponentVariants(
    @Param('id') componentId: string,
  ): Promise<VariantDto[]> {
    return this.componentsService.getComponentVariants(componentId);
  }

  @Get(':id/packs')
  @Roles(UserRole.EMPLOYEE, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get packs that include this component' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({
    status: 200,
    description: 'List of packs using this component with required and orderIndex',
  })
  @ApiResponse({ status: 404, description: 'Component not found' })
  async getComponentPacks(
    @Param('id') componentId: string,
  ): Promise<ComponentPackUsageDto[]> {
    return this.packsService.getPacksByComponentId(componentId);
  }

  @Get(':id/statistics')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get statistics for a component' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({
    status: 200,
    description: 'Component statistics including usage count, variant count, and recent usage',
  })
  @ApiResponse({ status: 404, description: 'Component not found' })
  async getComponentStatistics(
    @Param('id') componentId: string,
  ): Promise<ComponentStatisticsDto> {
    return this.componentsService.getComponentStatistics(componentId);
  }
}
