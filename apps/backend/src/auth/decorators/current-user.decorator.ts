import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from '@contracts/core';

/**
 * Decorator to extract the current authenticated user from the request
 * Usage: @CurrentUser() user: TokenPayload
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
