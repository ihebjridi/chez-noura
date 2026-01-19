import {
  LoginResponseDto,
  UserDto,
  MealDto,
  CreateOrderDto,
  OrderDto,
} from '@contracts/core';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
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

  // Meal endpoints
  async getMealsForDate(date: string): Promise<MealDto[]> {
    return this.request<MealDto[]>(`/meals?date=${date}`);
  }

  // Order endpoints
  async createOrder(data: CreateOrderDto, idempotencyKey?: string): Promise<OrderDto> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['x-idempotency-key'] = idempotencyKey;
    }
    return this.request<OrderDto>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    });
  }

  // Get employee's own orders
  async getMyOrders(): Promise<OrderDto[]> {
    return this.request<OrderDto[]>('/orders/me');
  }
}

export const apiClient = new ApiClient();
