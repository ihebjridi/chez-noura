/**
 * Kitchen operations DTOs for order aggregation and reporting
 */

/**
 * Variant quantity summary (total per variant)
 */
export interface VariantSummaryDto {
  variantId: string;
  variantName: string;
  componentId: string;
  componentName: string;
  packId: string;
  packName: string;
  totalQuantity: number;
}

/**
 * Business breakdown for a variant
 */
export interface BusinessVariantSummaryDto {
  businessId: string;
  businessName: string;
  quantity: number;
}

/**
 * Variant summary with business breakdown
 */
export interface VariantSummaryWithBusinessDto {
  variantId: string;
  variantName: string;
  componentId: string;
  componentName: string;
  packId: string;
  packName: string;
  totalQuantity: number;
  businesses: BusinessVariantSummaryDto[];
}

/**
 * Kitchen summary for a date (aggregated by variant)
 */
export interface KitchenSummaryDto {
  date: string; // ISO date string (YYYY-MM-DD)
  totalVariants: number; // Total number of variant items
  variants: VariantSummaryDto[];
  lockedAt?: string; // ISO datetime when the day was locked
}

/**
 * Kitchen summary with business breakdown
 */
export interface KitchenBusinessSummaryDto {
  date: string; // ISO date string (YYYY-MM-DD)
  totalVariants: number;
  variants: VariantSummaryWithBusinessDto[];
  lockedAt?: string;
}

/**
 * Day lock response
 */
export interface DayLockDto {
  date: string;
  locked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  ordersLocked: number; // Number of orders that were locked
}
