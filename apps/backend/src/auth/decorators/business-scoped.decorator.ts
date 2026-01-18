import { SetMetadata } from '@nestjs/common';

export const BUSINESS_SCOPED_KEY = 'businessScoped';

/**
 * Decorator to mark a route as business-scoped
 * When used, the route will only allow access to resources
 * within the user's business context
 */
export const BusinessScoped = () => SetMetadata(BUSINESS_SCOPED_KEY, true);
