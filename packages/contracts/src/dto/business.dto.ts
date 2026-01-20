import { EntityStatus } from '../enums';

/**
 * Business entity DTO
 */
export interface BusinessDto {
  id: string;
  name: string;
  legalName?: string;
  email: string;
  phone?: string;
  address?: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create business DTO
 */
export interface CreateBusinessDto {
  name: string;
  legalName?: string;
  email: string;
  phone?: string;
  address?: string;
  adminEmail: string; // Email for the business admin user
}

/**
 * Update business DTO
 */
export interface UpdateBusinessDto {
  name?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: EntityStatus;
}
