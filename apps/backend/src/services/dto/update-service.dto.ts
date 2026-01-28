import { IsString, IsBoolean, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceDto {
  @ApiPropertyOptional({
    description: 'Service name',
    example: 'Dejeuner',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'Lunch service',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the service is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the service is published (visible to businesses)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    description: 'Time when orders start being accepted each day (HH:MM format, 24-hour)',
    example: '08:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'orderStartTime must be in HH:MM format (24-hour)',
  })
  orderStartTime?: string;

  @ApiPropertyOptional({
    description: 'Time when orders stop being accepted each day (HH:MM format, 24-hour)',
    example: '14:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'cutoffTime must be in HH:MM format (24-hour)',
  })
  cutoffTime?: string;
}
