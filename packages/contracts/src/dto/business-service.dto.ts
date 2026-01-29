/**
 * Business Service DTOs for business service activation
 */

export interface BusinessServiceDto {
  id: string;
  businessId: string;
  serviceId: string;
  serviceName: string;
  serviceDescription?: string;
  /** Time in HH:MM when orders start being accepted each day */
  orderStartTime?: string;
  /** Time in HH:MM when orders stop being accepted each day */
  cutoffTime?: string;
  isActive: boolean;
  packs: BusinessServicePackDto[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessServicePackDto {
  id: string;
  packId: string;
  packName: string;
  packPrice: number;
  isActive: boolean;
  nextPackId?: string; // Pack that will be active starting from effectiveDate
  nextPackName?: string;
  effectiveDate?: string; // ISO date string when nextPackId takes effect
  createdAt: string;
  updatedAt: string;
}

export interface ActivateServiceDto {
  serviceId: string;
  packIds: string[]; // Packs to activate for this service
}

export interface UpdateBusinessServiceDto {
  isActive?: boolean;
  packIds?: string[]; // Update which packs are activated
}
