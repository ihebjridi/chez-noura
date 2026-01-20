import {
  Controller,
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
  VariantDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';
import { UpdateVariantDtoClass } from './dto/update-variant.dto';

@ApiTags('variants')
@ApiBearerAuth('JWT-auth')
@Controller('variants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VariantsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a variant' })
  @ApiParam({ name: 'id', description: 'Variant ID' })
  @ApiResponse({
    status: 200,
    description: 'Variant updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async updateVariant(
    @Param('id') variantId: string,
    @Body() updateVariantDto: UpdateVariantDtoClass,
    @CurrentUser() user: TokenPayload,
  ): Promise<VariantDto> {
    return this.componentsService.updateVariant(variantId, updateVariantDto, user);
  }
}
