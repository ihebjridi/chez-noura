/**
 * Employee Menu DTOs
 */

import { AvailablePackDto } from './pack.dto';

/**
 * Employee menu DTO - PUBLISHED DailyMenu with available packs, components, and variants
 */
export interface EmployeeMenuDto {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  status: string; // Should be 'PUBLISHED'
  packs: AvailablePackDto[];
  cutoffTime?: string; // ISO datetime string - when ordering closes for this date
  orderStartTime?: string; // ISO datetime string - when ordering opens for this date
}
