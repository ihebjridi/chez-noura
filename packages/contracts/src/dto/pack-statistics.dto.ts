/**
 * Pack Statistics DTOs
 */

export interface PackStatisticsDto {
  packId: string;
  packName: string;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: RecentOrderDto[];
  lastOrderDate: string | null;
  componentCount: number;
}

export interface ComponentStatisticsDto {
  componentId: string;
  componentName: string;
  totalUsage: number; // Total times used in orders
  variantCount: number;
  packCount: number; // Number of packs using this component
  recentUsage: RecentUsageDto[];
  lastUsedDate: string | null;
}

export interface VariantStatisticsDto {
  variantId: string;
  variantName: string;
  componentId: string;
  componentName: string;
  totalOrders: number;
  recentOrders: RecentOrderDto[];
  lastOrderDate: string | null;
  currentStock: number;
}

export interface RecentOrderDto {
  orderId: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  businessName?: string;
  employeeName?: string;
}

export interface RecentUsageDto {
  date: string;
  count: number;
  packNames: string[];
}
