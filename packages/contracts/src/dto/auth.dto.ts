import { UserRole } from '../enums';

/**
 * Login request DTO
 */
export interface LoginRequestDto {
  email: string;
  password: string;
}

/**
 * Login response DTO
 */
export interface LoginResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: UserDto;
}

/**
 * User DTO (used in auth responses)
 */
export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
  businessId?: string; // Only for BUSINESS_ADMIN and EMPLOYEE
  employeeId?: string; // Only for EMPLOYEE
}

/**
 * Token payload (for JWT decoding)
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  businessId?: string;
  employeeId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Employee login request DTO (email-only)
 */
export interface EmployeeLoginRequestDto {
  email: string;
}

/**
 * Refresh token request DTO
 */
export interface RefreshTokenRequestDto {
  refreshToken: string;
}

/**
 * Refresh token response DTO
 */
export interface RefreshTokenResponseDto {
  accessToken: string;
}
