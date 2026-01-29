import { OrderDto } from './order.dto';

/**
 * Dashboard summary for business portal (one date)
 */
export interface BusinessDashboardSummaryDto {
  date: string; // ISO date string (YYYY-MM-DD)
  activeEmployeesCount: number;
  totalOrders: number;
  totalCost: number;
  orders: OrderDto[];
  totalOrdersAllTime?: number;
  totalCostAllTime?: number;
}
