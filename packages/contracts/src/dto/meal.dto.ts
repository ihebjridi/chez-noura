import { EntityStatus } from '../enums';

/**
 * Meal entity DTO
 */
export interface MealDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  availableDate: string; // ISO date string (YYYY-MM-DD)
  isActive: boolean;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create meal DTO
 */
export interface CreateMealDto {
  name: string;
  description?: string;
  price: number;
  availableDate: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Update meal DTO
 */
export interface UpdateMealDto {
  name?: string;
  description?: string;
  price?: number;
  availableDate?: string;
  isActive?: boolean;
  status?: EntityStatus;
}

/**
 * Meal availability DTO (for ordering windows)
 */
export interface MealAvailabilityDto {
  mealId: string;
  availableDate: string;
  cutoffTime: string; // ISO datetime string - when ordering closes
  isAvailable: boolean;
}
