import {
  IsString,
  IsArray,
  ValidateNested,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CreateOrderItemDto {
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

export class CreateOrderDto {
  @ApiProperty({
    description: 'Date the order is for (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsDateString()
  orderDate: string;

  @ApiProperty({
    description: 'Pack ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  packId: string;

  @ApiProperty({
    description: 'Order items (component variant selections)',
    type: [CreateOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
