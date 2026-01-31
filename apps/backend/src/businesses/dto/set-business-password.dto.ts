import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetBusinessPasswordDto {
  @ApiProperty({
    description: 'New password for the business admin',
    example: 'SecurePassword123',
    minLength: 8,
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}
