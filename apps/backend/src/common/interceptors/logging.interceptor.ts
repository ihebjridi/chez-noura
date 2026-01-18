import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject('winston') private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const user = request.user;
    const requestId = request.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    request.id = requestId;

    const startTime = Date.now();

    const logContext = {
      requestId,
      method,
      url,
      userId: user?.userId || 'anonymous',
      role: user?.role || 'anonymous',
      businessId: user?.businessId || null,
      employeeId: user?.employeeId || null,
    };

    this.logger.info('Incoming request', logContext);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.info('Request completed', {
            ...logContext,
            statusCode: context.switchToHttp().getResponse().statusCode,
            duration: `${duration}ms`,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error('Request failed', {
            ...logContext,
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
          });
        },
      }),
    );
  }
}
