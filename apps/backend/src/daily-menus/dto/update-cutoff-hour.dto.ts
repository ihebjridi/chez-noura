import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCutoffHourValidationDto {
  @ApiProperty({
    description: 'Cutoff hour in HH:MM format (24-hour)',
    example: '14:00',
  })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'cutoffHour must be in HH:MM format (24-hour)',
  })
  cutoffHour: string;
}
