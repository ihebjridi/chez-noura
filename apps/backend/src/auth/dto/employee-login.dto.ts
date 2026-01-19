import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmployeeLoginDto {
  @ApiProperty({
    description: 'Employee email address',
    example: 'employee@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
