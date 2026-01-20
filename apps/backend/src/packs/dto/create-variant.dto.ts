import { IsString, IsNumber, IsBoolean, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDtoClass {
  @ApiProperty({
    description: 'Variant name',
    example: 'Lentil Soup',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Stock quantity',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @ApiPropertyOptional({
    description: 'Whether the variant is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
