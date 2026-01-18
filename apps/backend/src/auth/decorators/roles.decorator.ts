import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@contracts/core';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access a route
 * @param roles - Array of UserRole values
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
