import {
  Controller,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Get,
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
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import {
  VariantDto,
  TokenPayload,
  UserRole,
  VariantStatisticsDto,
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
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
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
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<VariantDto> {
    return this.componentsService.updateVariant(variantId, updateVariantDto, user, imageFile);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a variant' })
  @ApiParam({ name: 'id', description: 'Variant ID' })
  @ApiResponse({
    status: 204,
    description: 'Variant deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot delete: variant is referenced by order items' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async deleteVariant(
    @Param('id') variantId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<void> {
    return this.componentsService.deleteVariant(variantId, user);
  }

  @Get(':id/statistics')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get statistics for a variant' })
  @ApiParam({ name: 'id', description: 'Variant ID' })
  @ApiResponse({
    status: 200,
    description: 'Variant statistics including order count and recent orders',
  })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  async getVariantStatistics(@Param('id') variantId: string): Promise<VariantStatisticsDto> {
    return this.componentsService.getVariantStatistics(variantId);
  }
}
