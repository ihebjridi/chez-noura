import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePackDto {
  @ApiProperty({
    description: 'Pack name',
    example: 'Express',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Pack price',
    example: 25.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Whether the pack is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
