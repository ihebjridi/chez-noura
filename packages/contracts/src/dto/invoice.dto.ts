import { InvoiceStatus } from '../enums';

/**
 * Invoice item DTO (pack-based)
 */
export interface InvoiceItemDto {
  id: string;
  orderId: string;
  orderDate: string;
  packName: string;
  quantity: number; // Always 1 per order (one pack per order)
  unitPrice: number; // Pack price
  totalPrice: number; // Pack price × quantity (same as unitPrice for quantity=1)
}

/**
 * Invoice entity DTO
 */
export interface InvoiceDto {
  id: string;
  businessId: string;
  businessName: string;
  businessEmail: string;
  serviceId?: string; // Service this invoice is for
  serviceName?: string; // Service name
  invoiceNumber: string;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  status: InvoiceStatus;
  subtotal: number;
  tax?: number;
  total: number;
  items: InvoiceItemDto[];
  dueDate: string; // ISO date string
  issuedAt?: string; // ISO datetime string
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
  serviceId?: string; // Service this invoice is for
  serviceName?: string; // Service name
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  total: number;
  dueDate: string;
  createdAt: string;
}
