import {
  IsString,
  IsArray,
  ValidateNested,
  IsDateString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateOrderItemDto {
  @ApiProperty({
    description: 'Meal ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  mealId: string;

  @ApiProperty({
    description: 'Quantity of this meal',
    example: 2,
    minimum: 1,
  })
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Date the order is for (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsDateString()
  orderDate: string;

  @ApiProperty({
    description: 'Order items',
    type: [CreateOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
