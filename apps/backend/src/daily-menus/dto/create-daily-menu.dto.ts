import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDailyMenuValidationDto {
  @ApiProperty({
    description: 'Date for the daily menu (YYYY-MM-DD)',
    example: '2024-03-15',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}
