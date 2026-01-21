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

export interface DailyMenuWithDetailsDto extends DailyMenuDto {
  packs: DailyMenuPackDto[];
  variants: DailyMenuVariantDto[];
}

export interface CreateDailyMenuDto {
  date: string; // ISO date string (YYYY-MM-DD)
}

export interface AddPackToDailyMenuDto {
  packId: string;
}

export interface AddVariantToDailyMenuDto {
  variantId: string;
  initialStock: number;
}

export interface PublishDailyMenuResponseDto {
  success: boolean;
  warnings: string[];
}
