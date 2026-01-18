import { InvoiceStatus } from '../enums';

/**
 * Invoice item DTO
 */
export interface InvoiceItemDto {
  id: string;
  orderId: string;
  orderDate: string;
  employeeEmail: string;
  employeeName: string;
  mealName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Invoice entity DTO
 */
export interface InvoiceDto {
  id: string;
  businessId: string;
  businessName: string;
  businessEmail: string;
  invoiceNumber: string;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  status: InvoiceStatus;
  subtotal: number;
  tax?: number;
  total: number;
  items: InvoiceItemDto[];
  dueDate: string; // ISO date string
  paidAt?: string; // ISO datetime string
  createdAt: string;
  updatedAt: string;
}

/**
 * Create invoice DTO
 */
export interface CreateInvoiceDto {
  businessId: string;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  dueDate: string; // ISO date string
  tax?: number;
}

/**
 * Invoice summary DTO (for listing views)
 */
export interface InvoiceSummaryDto {
  id: string;
  invoiceNumber: string;
  businessName: string;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  total: number;
  dueDate: string;
  createdAt: string;
}
