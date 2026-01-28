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
  serviceId?: string;      // Service this pack belongs to
  serviceName?: string;     // Service name
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
  serviceId?: string;      // Service this pack belongs to
  serviceName?: string;     // Service name
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

/**
 * Order summary for kitchen operations
 * Represents an order with its pack and variant selections
 */
export interface KitchenOrderSummaryDto {
  orderId: string;
  businessName: string;
  employeeName: string;
  packName: string;
  packId: string;
  serviceId?: string;      // Service this pack belongs to
  serviceName?: string;     // Service name
  variants: Array<{
    componentName: string;
    variantName: string;
  }>;
}

/**
 * Detailed kitchen summary combining variant aggregation and order details
 */
export interface KitchenDetailedSummaryDto {
  date: string; // ISO date string (YYYY-MM-DD)
  totalVariants: number; // Total number of variant items
  totalOrders: number; // Total number of orders
  variants: VariantSummaryDto[];
  orders: KitchenOrderSummaryDto[];
  lockedAt?: string; // ISO datetime when the day was locked
}
