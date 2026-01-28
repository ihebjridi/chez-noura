import { IsString, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateServiceDtoClass {
  @ApiProperty({
    description: 'Service ID to activate',
    example: 'uuid-here',
  })
  @IsString()
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    description: 'Array of pack IDs to activate for this service',
    example: ['pack-id-1', 'pack-id-2'],
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  packIds: string[];
}
