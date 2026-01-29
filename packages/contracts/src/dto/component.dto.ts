/**
 * Component DTOs
 */

export interface ComponentDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComponentDto {
  name: string;
}

export interface UpdateComponentDto {
  name?: string;
}

/** Pack usage for a component: pack that includes this component with link fields */
export interface ComponentPackUsageDto {
  packId: string;
  packName: string;
  required: boolean;
  orderIndex: number;
}
