import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMealDto {
  @ApiProperty({
    description: 'Meal name',
    example: 'Chicken Tagine',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Meal description',
    example: 'Traditional Moroccan chicken tagine with vegetables',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Meal price in TND',
    example: 25.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Date when meal is available (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  availableDate: string; // ISO date string (YYYY-MM-DD)
}
