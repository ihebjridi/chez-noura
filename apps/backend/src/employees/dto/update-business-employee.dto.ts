import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EntityStatus } from '@contracts/core';

export class UpdateBusinessEmployeeDto {
  @ApiProperty({
    description: 'Employee first name',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Employee last name',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Employee status (ACTIVE, INACTIVE, SUSPENDED)',
    enum: EntityStatus,
    required: false,
  })
  @IsEnum(EntityStatus)
  @IsOptional()
  status?: EntityStatus;
}
