/**
 * Kitchen operations DTOs for order aggregation and reporting
 */

/**
 * Meal quantity summary (total per meal)
 */
export interface MealSummaryDto {
  mealId: string;
  mealName: string;
  totalQuantity: number;
  unitPrice: number;
  totalAmount: number;
}

/**
 * Business breakdown for a meal
 */
export interface BusinessMealSummaryDto {
  businessId: string;
  businessName: string;
  quantity: number;
  totalAmount: number;
}

/**
 * Meal summary with business breakdown
 */
export interface MealSummaryWithBusinessDto {
  mealId: string;
  mealName: string;
  totalQuantity: number;
  unitPrice: number;
  totalAmount: number;
  businesses: BusinessMealSummaryDto[];
}

/**
 * Kitchen summary for a date
 */
export interface KitchenSummaryDto {
  date: string; // ISO date string (YYYY-MM-DD)
  totalMeals: number; // Total number of meal items
  totalAmount: number; // Total revenue
  meals: MealSummaryDto[];
  lockedAt?: string; // ISO datetime when the day was locked
}

/**
 * Kitchen summary with business breakdown
 */
export interface KitchenBusinessSummaryDto {
  date: string; // ISO date string (YYYY-MM-DD)
  totalMeals: number;
  totalAmount: number;
  meals: MealSummaryWithBusinessDto[];
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
