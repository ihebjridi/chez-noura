import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPackToDailyMenuValidationDto {
  @ApiProperty({
    description: 'Pack ID to add to the daily menu',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  packId: string;
}
