/**
 * Employee Order DTOs
 */

/**
 * Create employee order DTO (uses dailyMenuId instead of orderDate)
 */
export interface CreateEmployeeOrderDto {
  dailyMenuId: string;
  packId: string;
  selectedVariants: EmployeeOrderVariantDto[];
}

/**
 * Employee order variant selection DTO
 */
export interface EmployeeOrderVariantDto {
  componentId: string;
  variantId: string;
}
