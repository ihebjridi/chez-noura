import { IsString, IsNumber, IsBoolean, IsOptional, Min, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateVariantDto } from '@contracts/core';

export class UpdateVariantDtoClass implements UpdateVariantDto {
  @ApiPropertyOptional({
    description: 'Component ID to move variant to',
  })
  @IsOptional()
  @IsUUID()
  componentId?: string;

  @ApiPropertyOptional({
    description: 'Variant name',
    example: 'Lentil Soup',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Stock quantity',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Whether the variant is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
