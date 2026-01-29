/**
 * Pack DTOs for Iftar Pack-based ordering
 */

export interface PackDto {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackDto {
  name: string;
  price: number;
  isActive?: boolean;
}

export interface UpdatePackDto {
  name?: string;
  price?: number;
  isActive?: boolean;
}

export interface PackComponentDto {
  id: string;
  packId: string;
  componentId: string;
  componentName: string;
  required: boolean;
  orderIndex: number;
}

export interface PackWithComponentsDto extends PackDto {
  components: PackComponentDto[];
}

export interface AvailablePackDto extends PackDto {
  components: AvailableComponentDto[];
  // Service information (optional for backward compatibility)
  serviceId?: string;
  serviceName?: string;
}

export interface AvailableComponentDto {
  id: string;
  name: string;
  required: boolean;
  orderIndex: number;
  variants: AvailableVariantDto[];
}

export interface AvailableVariantDto {
  id: string;
  name: string;
  stockQuantity: number;
  isActive: boolean;
  imageUrl?: string;
}

export interface CreatePackComponentDto {
  componentId: string;
  required: boolean;
  orderIndex: number;
}
