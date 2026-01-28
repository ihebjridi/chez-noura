import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddServiceToDailyMenuDto } from '@contracts/core';

export class AddServiceToDailyMenuValidationDto implements AddServiceToDailyMenuDto {
  @ApiProperty({
    description: 'Service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  serviceId: string;
}
