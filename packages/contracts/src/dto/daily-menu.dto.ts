/**
 * Daily Menu DTOs
 */

export enum DailyMenuStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  LOCKED = 'LOCKED',
}

export interface DailyMenuDto {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  status: DailyMenuStatus;
  cutoffHour?: string; // Cutoff hour in HH:MM format (e.g., "14:00")
  publishedAt?: string; // ISO datetime string
  createdAt: string;
  updatedAt: string;
}

export interface DailyMenuPackDto {
  id: string;
  dailyMenuId: string;
  packId: string;
  packName: string;
  packPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyMenuVariantDto {
  id: string;
  dailyMenuId: string;
  variantId: string;
  variantName: string;
  componentId: string;
  componentName: string;
  initialStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyMenuServiceDto {
  id: string;
  dailyMenuId: string;
  serviceId: string;
  serviceName: string;
  serviceDescription?: string;
  packs: DailyMenuPackDto[]; // Packs in this service that are in the menu
  variants: DailyMenuServiceVariantDto[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyMenuServiceVariantDto {
  id: string;
  dailyMenuServiceId: string;
  variantId: string;
  variantName: string;
  componentId: string;
  componentName: string;
  initialStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyMenuWithDetailsDto extends DailyMenuDto {
  packs: DailyMenuPackDto[];
  variants: DailyMenuVariantDto[];
  services: DailyMenuServiceDto[];
}

export interface CreateDailyMenuDto {
  date: string; // ISO date string (YYYY-MM-DD)
  cutoffHour?: string; // Cutoff hour in HH:MM format (e.g., "14:00"), defaults to "14:00" if not provided
}

export interface AddPackToDailyMenuDto {
  packId: string;
}

export interface AddVariantToDailyMenuDto {
  variantId: string;
  initialStock?: number;
}

export interface AddServiceToDailyMenuDto {
  serviceId: string;
}

export interface AddVariantToDailyMenuServiceDto {
  variantId: string;
  initialStock?: number;
}

export interface PublishDailyMenuResponseDto {
  success: boolean;
  warnings: string[];
}
