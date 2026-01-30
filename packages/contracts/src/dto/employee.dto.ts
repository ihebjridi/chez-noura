import { EntityStatus, UserRole } from '../enums';

/**
 * Employee entity DTO
 * role is set when listing business employees (Admin vs Employee)
 */
export interface EmployeeDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessId: string;
  status: EntityStatus;
  /** Present when listing employees for a business (BUSINESS_ADMIN = admin, EMPLOYEE = employee) */
  role?: UserRole;
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
