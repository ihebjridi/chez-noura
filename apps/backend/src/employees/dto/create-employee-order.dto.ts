import {
  IsString,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class EmployeeOrderVariantDto {
  @ApiProperty({
    description: 'Component ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  componentId: string;

  @ApiProperty({
    description: 'Variant ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  variantId: string;
}

export class CreateEmployeeOrderDto {
  @ApiProperty({
    description: 'Daily Menu ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  dailyMenuId: string;

  @ApiProperty({
    description: 'Pack ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  packId: string;

  @ApiProperty({
    description: 'Selected variants (component and variant selections)',
    type: [EmployeeOrderVariantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeOrderVariantDto)
  selectedVariants: EmployeeOrderVariantDto[];
}
