import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddVariantToDailyMenuDto } from '@contracts/core';

export class AddVariantToDailyMenuValidationDto implements AddVariantToDailyMenuDto {
  @ApiProperty({
    description: 'Variant ID to add to the daily menu',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({
    description: 'Initial stock quantity for this variant',
    example: 50,
    minimum: 0,
    default: 50,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  initialStock?: number;
}
