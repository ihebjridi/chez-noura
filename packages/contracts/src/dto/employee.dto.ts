import { EntityStatus } from '../enums';

/**
 * Employee entity DTO
 */
export interface EmployeeDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessId: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create employee DTO
 */
export interface CreateEmployeeDto {
  email: string;
  firstName: string;
  lastName: string;
  businessId: string;
}

/**
 * Update employee DTO
 */
export interface UpdateEmployeeDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: EntityStatus;
}
