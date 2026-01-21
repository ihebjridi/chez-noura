import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddVariantToDailyMenuValidationDto {
  @ApiProperty({
    description: 'Variant ID to add to the daily menu',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({
    description: 'Initial stock quantity for this variant',
    example: 100,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  initialStock: number;
}
