import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, TokenPayload } from '@contracts/core';
import { BUSINESS_SCOPED_KEY } from '../decorators/business-scoped.decorator';

@Injectable()
export class BusinessScopeGuard implements CanActivate {
  private readonly logger = new Logger(BusinessScopeGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isBusinessScoped = this.reflector.getAllAndOverride<boolean>(
      BUSINESS_SCOPED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isBusinessScoped) {
      return true; // Not business-scoped, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user: TokenPayload = request.user;

    if (!user) {
      this.logger.warn('BusinessScopeGuard: No user found in request');
      return false;
    }

    // SUPER_ADMIN has global access
    if (user.role === UserRole.SUPER_ADMIN) {
      this.logger.debug(
        `BusinessScopeGuard: SUPER_ADMIN access granted for ${request.method} ${request.url}`,
      );
      return true;
    }

    // BUSINESS_ADMIN and EMPLOYEE must have a businessId
    if (!user.businessId) {
      this.logger.warn(
        `BusinessScopeGuard: User ${user.userId} (${user.role}) does not belong to a business`,
      );
      throw new ForbiddenException('User does not belong to a business');
    }

    // Extract businessId from route params or body
    const requestedBusinessId =
      request.params.businessId ||
      request.body?.businessId ||
      request.query.businessId;

    // If no businessId in request, allow (will be filtered by service layer)
    // This is acceptable for endpoints like GET /invoices/:id where the service
    // validates ownership after fetching the resource
    if (!requestedBusinessId) {
      this.logger.debug(
        `BusinessScopeGuard: No businessId in request, allowing access (service layer will enforce isolation) - ${request.method} ${request.url} for user ${user.userId} (business: ${user.businessId})`,
      );
      return true;
    }

    // Verify user's businessId matches requested businessId
    if (user.businessId !== requestedBusinessId) {
      this.logger.warn(
        `BusinessScopeGuard: Access denied - User ${user.userId} (business: ${user.businessId}) attempted to access business ${requestedBusinessId} via ${request.method} ${request.url}`,
      );
      throw new ForbiddenException('Access denied to this business resource');
    }

    this.logger.debug(
      `BusinessScopeGuard: Access granted for user ${user.userId} (business: ${user.businessId}) to ${request.method} ${request.url}`,
    );
    return true;
  }
}
