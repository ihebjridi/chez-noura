/**
 * Activity log DTO
 */
export interface ActivityLogDto {
  id: string;
  userId?: string;
  businessId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * Create activity log DTO
 */
export interface CreateActivityLogDto {
  userId?: string;
  businessId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}
