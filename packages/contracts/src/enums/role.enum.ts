/**
 * User role definitions for the B2B catering platform
 */
export enum UserRole {
  /**
   * Super Admin - The caterer who owns the platform
   * Can onboard businesses, create menus, manage global settings
   */
  SUPER_ADMIN = 'SUPER_ADMIN',

  /**
   * Business Admin - Manages employees and views business-level data
   * Provided by the caterer, manages their company's employees
   */
  BUSINESS_ADMIN = 'BUSINESS_ADMIN',

  /**
   * Employee - End user who places meal orders
   * Invited by Business Admin, selects meals within time windows
   */
  EMPLOYEE = 'EMPLOYEE',
}
