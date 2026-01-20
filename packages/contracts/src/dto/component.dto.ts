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
