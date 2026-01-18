import { OrderStatus } from '../enums';

/**
 * Order item DTO (meal selection within an order)
 */
export interface OrderItemDto {
  id: string;
  mealId: string;
  mealName: string;
  mealPrice: number;
  quantity: number;
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
  orderDate: string; // ISO date string (YYYY-MM-DD)
  status: OrderStatus;
  items: OrderItemDto[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create order DTO (for employee placing order)
 */
export interface CreateOrderDto {
  orderDate: string; // ISO date string (YYYY-MM-DD)
  items: CreateOrderItemDto[];
}

/**
 * Create order item DTO
 */
export interface CreateOrderItemDto {
  mealId: string;
  quantity: number;
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
