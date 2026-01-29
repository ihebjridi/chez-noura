import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateComponentDto } from '@contracts/core';

export class UpdateComponentDtoClass implements UpdateComponentDto {
  @ApiProperty({
    description: 'Component name',
    example: 'Soup',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}
