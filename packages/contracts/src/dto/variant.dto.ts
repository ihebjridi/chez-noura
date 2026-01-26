/**
 * Variant DTOs
 */

export interface VariantDto {
  id: string;
  componentId: string;
  componentName: string;
  name: string;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVariantDto {
  componentId: string;
  name: string;
  stockQuantity: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateVariantDto {
  name?: string;
  stockQuantity?: number;
  imageUrl?: string;
  isActive?: boolean;
}
