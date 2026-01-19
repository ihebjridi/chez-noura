import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus } from '@contracts/core';

export class UpdateMealDto {
  @ApiPropertyOptional({
    description: 'Meal name',
    example: 'Chicken Tagine',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Meal description',
    example: 'Traditional Moroccan chicken tagine with vegetables',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Meal price in TND',
    example: 25.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    description: 'Date when meal is available (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsOptional()
  availableDate?: string;

  @ApiPropertyOptional({
    description: 'Whether meal is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Meal status',
    enum: EntityStatus,
    example: EntityStatus.ACTIVE,
  })
  @IsEnum(EntityStatus)
  @IsOptional()
  status?: EntityStatus;
}
