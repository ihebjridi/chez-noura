import { IsUUID, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddVariantToDailyMenuServiceDto } from '@contracts/core';

export class AddVariantToDailyMenuServiceValidationDto implements AddVariantToDailyMenuServiceDto {
  @ApiProperty({
    description: 'Variant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  variantId: string;

  @ApiPropertyOptional({
    description: 'Initial stock quantity for this variant',
    example: 50,
    default: 50,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  initialStock?: number;
}
