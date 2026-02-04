import {
  LoginResponseDto,
  UserDto,
  MealDto,
  CreateOrderDto,
  OrderDto,
  EmployeeMenuDto,
  CreateEmployeeOrderDto,
  BusinessDto,
} from '@contracts/core';
import { readOnlyFallback } from './readonly-fallback';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private degradedMode: boolean = false;

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache: boolean = false,
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        // If it's a server error (5xx), check if we should use cache
        if (response.status >= 500 && useCache) {
          this.degradedMode = true;
          throw new Error('BACKEND_DEGRADED');
        }
        
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      // Backend is healthy, reset degraded mode
      this.degradedMode = false;
      
      // Handle empty responses (e.g., when backend returns null)
      // Check content-length first
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0') {
        return null as T;
      }
      
      // Get response text first to check if it's empty
      const text = await response.text();
      
      // Handle completely empty response
      if (!text || text.trim() === '') {
        return null as T;
      }
      
      // Try to parse JSON
      try {
        const parsed = JSON.parse(text);
        // Handle explicit null from backend
        if (parsed === null) {
          return null as T;
        }
        return parsed;
      } catch (e) {
        // If JSON parsing fails and text is 'null' (string), return null
        if (text.trim() === 'null') {
          return null as T;
        }
        // Otherwise, rethrow the parsing error
        throw new Error(`Failed to parse JSON response: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    } catch (error: any) {
      // Network error or timeout
      if ((error.name === 'AbortError' || error.message === 'Failed to fetch') && useCache) {
        this.degradedMode = true;
        throw new Error('BACKEND_DEGRADED');
      }
      throw error;
    }
  }

  // Auth endpoints
  async loginEmployee(email: string): Promise<LoginResponseDto> {
    return this.request<LoginResponseDto>('/auth/login/employee', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getCurrentUser(): Promise<UserDto> {
    return this.request<UserDto>('/auth/me');
  }

  // Meal endpoints (kept for backward compatibility if needed)
  async getMealsForDate(date: string): Promise<MealDto[]> {
    try {
      const meals = await this.request<MealDto[]>(`/meals?date=${date}`, {}, true);
      // Cache successful response
      readOnlyFallback.cacheMeals(date, meals);
      return meals;
    } catch (error: any) {
      // If backend is degraded, try to return cached data
      if (error.message === 'BACKEND_DEGRADED') {
        const cached = readOnlyFallback.getCachedMeals(date);
        if (cached) {
          console.warn('Using cached meals - backend is degraded');
          return cached;
        }
        throw new Error('Backend is unavailable and no cached data found. Please try again later.');
      }
      throw error;
    }
  }

  // Order endpoints (legacy POST /orders; app uses createEmployeeOrder)
  async createOrder(data: CreateOrderDto, idempotencyKey?: string): Promise<OrderDto> {
    // Never use cache for write operations
    if (this.degradedMode) {
      throw new Error('Backend is unavailable. Orders cannot be placed at this time. Please try again later.');
    }

    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['x-idempotency-key'] = idempotencyKey;
    }
    
    try {
      const order = await this.request<OrderDto>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
        headers,
      });
      
      // Update cached orders after successful creation
      const cachedOrders = readOnlyFallback.getCachedOrders() || [];
      readOnlyFallback.cacheOrders([order, ...cachedOrders]);
      
      return order;
    } catch (error: any) {
      if (error.message === 'BACKEND_DEGRADED') {
        throw new Error('Backend is unavailable. Orders cannot be placed at this time. Please try again later.');
      }
      throw error;
    }
  }

  // Get employee's own orders
  async getMyOrders(): Promise<OrderDto[]> {
    try {
      const orders = await this.request<OrderDto[]>('/orders/me', {}, true);
      // Cache successful response
      readOnlyFallback.cacheOrders(orders);
      return orders;
    } catch (error: any) {
      // If backend is degraded, try to return cached data
      if (error.message === 'BACKEND_DEGRADED') {
        const cached = readOnlyFallback.getCachedOrders();
        if (cached) {
          console.warn('Using cached orders - backend is degraded');
          return cached;
        }
        throw new Error('Backend is unavailable and no cached data found. Please try again later.');
      }
      throw error;
    }
  }

  // Employee endpoints (new pack-based ordering)
  /**
   * Get published daily menu for a specific date
   * Returns menu with available packs, components, and variants (stock > 0)
   */
  async getEmployeeMenu(date: string): Promise<EmployeeMenuDto> {
    try {
      const menu = await this.request<EmployeeMenuDto>(`/employee/menu?date=${date}`, {}, true);
      return menu;
    } catch (error: any) {
      if (error.message === 'BACKEND_DEGRADED') {
        throw new Error('Backend is unavailable. Please try again later.');
      }
      throw error;
    }
  }

  /**
   * Create a new employee order using dailyMenuId
   * Uses the new pack-based ordering system
   */
  async createEmployeeOrder(data: CreateEmployeeOrderDto): Promise<OrderDto> {
    // Never use cache for write operations
    if (this.degradedMode) {
      throw new Error('Backend is unavailable. Orders cannot be placed at this time. Please try again later.');
    }
    
    try {
      const order = await this.request<OrderDto>('/employee/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      // Update cached orders after successful creation
      const cachedOrders = readOnlyFallback.getCachedOrders() || [];
      readOnlyFallback.cacheOrders([order, ...cachedOrders]);
      
      return order;
    } catch (error: any) {
      if (error.message === 'BACKEND_DEGRADED') {
        throw new Error('Backend is unavailable. Orders cannot be placed at this time. Please try again later.');
      }
      throw error;
    }
  }

  /**
   * Get all today's orders for the current employee (one per service)
   * Returns array of orders - can be multiple if employee ordered from multiple services
   */
  async getTodayOrders(): Promise<OrderDto[]> {
    try {
      const orders = await this.request<OrderDto[]>('/employee/orders/today', {}, true);
      // Handle case where backend returns empty array or null
      return Array.isArray(orders) ? orders : [];
    } catch (error: any) {
      // If 404, that means no orders exist - return empty array
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return [];
      }
      
      // If backend is degraded, try to return cached data
      if (error.message === 'BACKEND_DEGRADED') {
        const cached = readOnlyFallback.getCachedOrders();
        if (cached) {
          const { getTodayISO } = await import('./date-utils');
          const today = getTodayISO();
          const todayOrders = cached.filter((o) => o.orderDate === today);
          if (todayOrders.length > 0) {
            console.warn('Using cached today orders - backend is degraded');
            return todayOrders;
          }
        }
        return [];
      }
      throw error;
    }
  }

  /**
   * Get today's first order for the current employee (backward compatibility)
   * Returns null if no order exists for today
   * @deprecated Use getTodayOrders instead to support multiple orders per day
   */
  async getTodayOrder(): Promise<OrderDto | null> {
    try {
      const orders = await this.getTodayOrders();
      return orders.length > 0 ? orders[0] : null;
    } catch (error: any) {
      // If 404, that means no order exists - return null
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return null;
      }
      
      // If backend is degraded, try to return cached data
      if (error.message === 'BACKEND_DEGRADED') {
        const cached = readOnlyFallback.getCachedOrders();
        if (cached) {
          const { getTodayISO } = await import('./date-utils');
          const today = getTodayISO();
          const todayOrder = cached.find((o) => o.orderDate === today);
          if (todayOrder) {
            console.warn('Using cached today order - backend is degraded');
            return todayOrder;
          }
        }
        return null;
      }
      throw error;
    }
  }

  /**
   * Get the employee's affiliated business information
   */
  async getMyBusiness(): Promise<BusinessDto> {
    try {
      const business = await this.request<BusinessDto>('/employee/business', {}, true);
      return business;
    } catch (error: any) {
      if (error.message === 'BACKEND_DEGRADED') {
        throw new Error('Backend is unavailable. Please try again later.');
      }
      throw error;
    }
  }

  /**
   * Check menu availability for a date range
   * Returns a map of date -> has published menu
   */
  async getMenuAvailability(startDate: string, endDate: string): Promise<Record<string, boolean>> {
    const availability: Record<string, boolean> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate all dates in range
    const { formatDateToISO } = await import('./date-utils');
    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(formatDateToISO(current));
      current.setDate(current.getDate() + 1);
    }
    
    // Check each date
    await Promise.all(
      dates.map(async (date) => {
        try {
          await this.getEmployeeMenu(date);
          availability[date] = true;
        } catch (err) {
          // Menu not available for this date
          availability[date] = false;
        }
      })
    );
    
    return availability;
  }

  /**
   * Check if backend is in degraded mode
   */
  isDegradedMode(): boolean {
    return this.degradedMode;
  }
}

export const apiClient = new ApiClient();
