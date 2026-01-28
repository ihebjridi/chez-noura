import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDailyMenuValidationDto {
  @ApiProperty({
    description: 'Date for the daily menu (YYYY-MM-DD)',
    example: '2024-03-15',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Cutoff hour in HH:MM format (24-hour), defaults to "14:00" if not provided',
    example: '14:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'cutoffHour must be in HH:MM format (24-hour)',
  })
  cutoffHour?: string;
}
