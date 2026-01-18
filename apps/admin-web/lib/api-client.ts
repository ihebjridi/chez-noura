import {
  LoginRequestDto,
  LoginResponseDto,
  UserDto,
  BusinessDto,
  CreateBusinessDto,
  MealDto,
  CreateMealDto,
  OrderSummaryDto,
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
  async login(credentials: LoginRequestDto): Promise<LoginResponseDto> {
    return this.request<LoginResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<UserDto> {
    return this.request<UserDto>('/auth/me');
  }

  // Business endpoints (to be implemented in backend)
  async getBusinesses(): Promise<BusinessDto[]> {
    return this.request<BusinessDto[]>('/businesses');
  }

  async createBusiness(data: CreateBusinessDto): Promise<BusinessDto> {
    return this.request<BusinessDto>('/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Meal endpoints (to be implemented in backend)
  async getMeals(): Promise<MealDto[]> {
    return this.request<MealDto[]>('/meals');
  }

  async createMeal(data: CreateMealDto): Promise<MealDto> {
    return this.request<MealDto>('/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Order endpoints
  async getBusinessOrders(): Promise<OrderSummaryDto[]> {
    return this.request<OrderSummaryDto[]>('/business/orders');
  }
}

export const apiClient = new ApiClient();
