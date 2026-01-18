import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, TokenPayload } from '@contracts/core';
import { BUSINESS_SCOPED_KEY } from '../decorators/business-scoped.decorator';

@Injectable()
export class BusinessScopeGuard implements CanActivate {
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
      return false;
    }

    // SUPER_ADMIN has global access
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // BUSINESS_ADMIN and EMPLOYEE must have a businessId
    if (!user.businessId) {
      throw new ForbiddenException('User does not belong to a business');
    }

    // Extract businessId from route params or body
    const requestedBusinessId =
      request.params.businessId ||
      request.body?.businessId ||
      request.query.businessId;

    // If no businessId in request, allow (will be filtered by service layer)
    if (!requestedBusinessId) {
      return true;
    }

    // Verify user's businessId matches requested businessId
    if (user.businessId !== requestedBusinessId) {
      throw new ForbiddenException('Access denied to this business resource');
    }

    return true;
  }
}
