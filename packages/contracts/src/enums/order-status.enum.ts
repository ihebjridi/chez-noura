/**
 * Order status definitions
 */
export enum OrderStatus {
  /**
   * Order is pending - employee has selected but not yet locked
   */
  PENDING = 'PENDING',

  /**
   * Order is confirmed and locked after cutoff time
   */
  CONFIRMED = 'CONFIRMED',

  /**
   * Order has been cancelled (before cutoff)
   */
  CANCELLED = 'CANCELLED',
}
