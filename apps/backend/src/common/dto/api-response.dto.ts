import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API error response
 */
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'BAD_REQUEST' })
  code: string;

  @ApiProperty({ example: 'Invalid request parameters' })
  message: string;

  @ApiProperty({ required: false })
  details?: any;

  @ApiProperty({ example: 'req-1234567890-abc123' })
  requestId?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  timestamp: string;
}
