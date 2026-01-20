import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ComponentsService } from './components.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import {
  ComponentDto,
  VariantDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';
import { CreateComponentDtoClass } from './dto/create-component.dto';
import { CreateVariantDtoClass } from './dto/create-variant.dto';
import { UpdateVariantDtoClass } from './dto/update-variant.dto';

@ApiTags('components')
@ApiBearerAuth('JWT-auth')
@Controller('components')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

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

  @Post(':id/variants')
  @Roles(UserRole.SUPER_ADMIN)
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
  ): Promise<VariantDto> {
    return this.componentsService.createVariant(componentId, createVariantDto, user);
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
}
