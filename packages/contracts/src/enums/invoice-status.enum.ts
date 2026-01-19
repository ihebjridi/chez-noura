/**
 * Invoice status definitions
 */
export enum InvoiceStatus {
  /**
   * Invoice is in draft state - can be modified
   */
  DRAFT = 'DRAFT',

  /**
   * Invoice has been issued to the business - immutable
   */
  ISSUED = 'ISSUED',

  /**
   * Invoice has been paid
   */
  PAID = 'PAID',
}
