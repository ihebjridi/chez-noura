import { SetMetadata } from '@nestjs/common';

export const LOG_ACTIVITY_KEY = 'log_activity';

export interface LogActivityOptions {
  action: string;
  details?: (request: any, result?: any) => string | object;
}

/**
 * Decorator to log an activity when a method is called
 * Usage: @LogActivity({ action: 'BUSINESS_UPDATED' })
 */
export const LogActivity = (options: LogActivityOptions) =>
  SetMetadata(LOG_ACTIVITY_KEY, options);
