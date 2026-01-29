import { OrderStatus } from '../enums';

/**
 * Order item DTO (component variant selection within an order)
 */
export interface OrderItemDto {
  id: string;
  componentId: string;
  componentName: string;
  variantId: string;
  variantName: string;
  variantImageUrl?: string;
}

/**
 * Order entity DTO
 */
export interface OrderDto {
  id: string;
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  businessId: string;
  businessName: string;
  packId: string;
  packName: string;
  packPrice: number;
  orderDate: string; // ISO date string (YYYY-MM-DD)
  status: OrderStatus;
  items: OrderItemDto[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  // Service information (optional for backward compatibility)
  serviceId?: string;
  serviceName?: string;
}

/**
 * Create order DTO (for employee placing order)
 */
export interface CreateOrderDto {
  orderDate: string; // ISO date string (YYYY-MM-DD)
  packId: string;
  items: CreateOrderItemDto[];
}

/**
 * Create order item DTO (component variant selection)
 */
export interface CreateOrderItemDto {
  componentId: string;
  variantId: string;
}

/**
 * Order summary DTO (for business/admin views)
 */
export interface OrderSummaryDto {
  orderId: string;
  employeeEmail: string;
  employeeName: string;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
}
