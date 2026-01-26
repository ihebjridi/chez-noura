import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ActivityLogsService } from '../activity-logs.service';
import { LOG_ACTIVITY_KEY, LogActivityOptions } from '../decorators/log-activity.decorator';
import { UserRole } from '@contracts/core';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private activityLogsService: ActivityLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const options = this.reflector.get<LogActivityOptions>(
      LOG_ACTIVITY_KEY,
      context.getHandler(),
    );

    // Only log if decorator is present and user is authenticated
    if (!options || !user) {
      return next.handle();
    }

    // Only log for BUSINESS_ADMIN actions (or if explicitly needed for SUPER_ADMIN)
    if (user.role !== UserRole.BUSINESS_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      return next.handle();
    }

    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'] || undefined;

    return next.handle().pipe(
      tap({
        next: async (data) => {
          try {
            let details: string | undefined = undefined;
            if (options.details) {
              const detailsResult = options.details(request, data);
              details = typeof detailsResult === 'string' 
                ? detailsResult 
                : JSON.stringify(detailsResult);
            }

            await this.activityLogsService.create({
              userId: user.userId,
              businessId: user.businessId || undefined,
              action: options.action,
              details,
              ipAddress,
              userAgent,
            });
          } catch (error) {
            // Don't fail the request if logging fails
            console.error('Failed to log activity:', error);
          }
        },
        error: async (error) => {
          // Optionally log errors too
          try {
            await this.activityLogsService.create({
              userId: user.userId,
              businessId: user.businessId || undefined,
              action: `${options.action}_FAILED`,
              details: JSON.stringify({ error: error.message }),
              ipAddress,
              userAgent,
            });
          } catch (logError) {
            console.error('Failed to log activity error:', logError);
          }
        },
      }),
    );
  }

  private getIpAddress(request: any): string | undefined {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      undefined
    );
  }
}
