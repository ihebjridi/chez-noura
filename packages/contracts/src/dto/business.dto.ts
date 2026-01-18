import { EntityStatus } from '../enums';

/**
 * Business entity DTO
 */
export interface BusinessDto {
  id: string;
  name: string;
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
  email: string;
  phone?: string;
  address?: string;
}

/**
 * Update business DTO
 */
export interface UpdateBusinessDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: EntityStatus;
}
