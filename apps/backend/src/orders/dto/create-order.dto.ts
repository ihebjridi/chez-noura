import { IsString, IsArray, ValidateNested, IsDateString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsUUID()
  mealId: string;

  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsDateString()
  orderDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
