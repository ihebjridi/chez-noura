/**
 * Invoice status definitions
 */
export enum InvoiceStatus {
  /**
   * Invoice is in draft state
   */
  DRAFT = 'DRAFT',

  /**
   * Invoice has been sent to the business
   */
  SENT = 'SENT',

  /**
   * Invoice has been paid
   */
  PAID = 'PAID',

  /**
   * Invoice is overdue
   */
  OVERDUE = 'OVERDUE',
}
