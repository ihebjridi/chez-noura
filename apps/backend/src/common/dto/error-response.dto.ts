/**
 * Standard error response DTO
 * Used for consistent error formatting across the API
 */
export class ErrorResponseDto {
  /**
   * HTTP status code
   */
  statusCode: number;

  /**
   * Error code (machine-readable)
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Optional error details
   */
  details?: any;

  /**
   * Request ID for tracing
   */
  requestId?: string;

  /**
   * Timestamp of the error
   */
  timestamp: string;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: any,
    requestId?: string,
  ) {
    this.statusCode = statusCode;
    this.code = code;
    this.message = message;
    this.details = details;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
  }
}
