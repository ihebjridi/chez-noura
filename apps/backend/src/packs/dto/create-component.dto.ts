import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateComponentDto } from '@contracts/core';

export class CreateComponentDtoClass implements CreateComponentDto {
  @ApiProperty({
    description: 'Component name',
    example: 'Soup',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
