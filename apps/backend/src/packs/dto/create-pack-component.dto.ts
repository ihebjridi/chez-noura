import { IsUUID, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePackComponentDto {
  @ApiProperty({
    description: 'Component ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  componentId: string;

  @ApiProperty({
    description: 'Whether this component is required for the pack',
    example: true,
  })
  @IsBoolean()
  required: boolean;

  @ApiProperty({
    description: 'Order index for displaying components',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  orderIndex: number;
}
