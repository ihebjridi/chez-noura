/**
 * Service DTOs for service-based pack management
 */

export interface ServiceDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isPublished: boolean;
  orderStartTime?: string; // Time in HH:MM format when orders start being accepted each day
  cutoffTime?: string; // Time in HH:MM format when orders stop being accepted each day
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  isActive?: boolean;
  isPublished?: boolean;
  orderStartTime?: string; // Time in HH:MM format
  cutoffTime?: string; // Time in HH:MM format
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  isPublished?: boolean;
  orderStartTime?: string; // Time in HH:MM format
  cutoffTime?: string; // Time in HH:MM format
}

export interface ServiceWithPacksDto extends ServiceDto {
  packs: ServicePackDto[];
}

export interface ServicePackDto {
  id: string;
  serviceId: string;
  packId: string;
  packName: string;
  packPrice: number;
  createdAt: string;
  updatedAt: string;
}
