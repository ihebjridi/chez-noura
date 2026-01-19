/**
 * Order status definitions
 */
export enum OrderStatus {
  /**
   * Order is created - employee has placed order but not yet locked
   */
  CREATED = 'CREATED',

  /**
   * Order is locked after cutoff time - read-only
   */
  LOCKED = 'LOCKED',

  /**
   * Order has been cancelled (before cutoff)
   */
  CANCELLED = 'CANCELLED',
}
