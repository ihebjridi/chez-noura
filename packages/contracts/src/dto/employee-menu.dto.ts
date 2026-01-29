/**
 * Employee Menu DTOs
 */

import { AvailablePackDto } from './pack.dto';

/**
 * Per-service order window (cutoff and optional order start) for the employee menu.
 * Each available service has its own countdown.
 */
export interface EmployeeMenuServiceWindowDto {
  serviceId: string;
  serviceName: string;
  cutoffTime: string; // ISO datetime string
  orderStartTime?: string; // ISO datetime string
}

/**
 * Employee menu DTO - PUBLISHED DailyMenu with available packs, components, and variants
 */
export interface EmployeeMenuDto {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  status: string; // Should be 'PUBLISHED'
  packs: AvailablePackDto[];
  cutoffTime?: string; // ISO datetime string - earliest cutoff (when there are packs)
  orderStartTime?: string; // ISO datetime string - latest order start (when there are packs)
  /** Per-service windows for countdown; only present when there are available packs */
  serviceWindows?: EmployeeMenuServiceWindowDto[];
}
