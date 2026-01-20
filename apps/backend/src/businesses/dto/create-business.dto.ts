import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBusinessDto } from '@contracts/core';

export class CreateBusinessDtoClass implements CreateBusinessDto {
  @ApiProperty({ description: 'Business name (must be unique)' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Legal name of the business' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiProperty({ description: 'Business email (must be unique)' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Business phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Business address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Email for the business admin user' })
  @IsNotEmpty()
  @IsEmail()
  adminEmail: string;
}
