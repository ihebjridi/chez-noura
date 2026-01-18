/**
 * Generic entity status (for Business, Meal, Employee)
 */
export enum EntityStatus {
  /**
   * Entity is active and available
   */
  ACTIVE = 'ACTIVE',

  /**
   * Entity is inactive (soft delete)
   */
  INACTIVE = 'INACTIVE',

  /**
   * Entity is suspended (temporary restriction)
   */
  SUSPENDED = 'SUSPENDED',
}
