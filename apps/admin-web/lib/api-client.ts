import {
  LoginRequestDto,
  LoginResponseDto,
  UserDto,
  MealDto,
  CreateMealDto,
  UpdateMealDto,
  OrderDto,
  OrderSummaryDto,
  KitchenSummaryDto,
  KitchenBusinessSummaryDto,
  DayLockDto,
  InvoiceDto,
  InvoiceSummaryDto,
  BusinessDto,
  CreateBusinessDto,
  UpdateBusinessDto,
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

  // Meal endpoints
  async getMeals(date?: string): Promise<MealDto[]> {
    const query = date ? `?date=${date}` : '';
    return this.request<MealDto[]>(`/meals${query}`);
  }

  async createMeal(data: CreateMealDto): Promise<MealDto> {
    return this.request<MealDto>('/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMeal(id: string, data: UpdateMealDto): Promise<MealDto> {
    return this.request<MealDto>(`/meals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Order endpoints
  async getAdminOrders(): Promise<OrderDto[]> {
    return this.request<OrderDto[]>('/orders/admin');
  }

  // Kitchen operations endpoints
  async lockDay(date: string): Promise<DayLockDto> {
    return this.request<DayLockDto>(`/ops/lock-day?date=${date}`, {
      method: 'POST',
    });
  }

  async getKitchenSummary(date: string): Promise<KitchenSummaryDto> {
    return this.request<KitchenSummaryDto>(`/ops/summary?date=${date}&format=json`);
  }

  async getKitchenBusinessSummary(date: string): Promise<KitchenBusinessSummaryDto> {
    return this.request<KitchenBusinessSummaryDto>(`/ops/business-summary?date=${date}&format=json`);
  }

  // Invoice endpoints
  async getAdminInvoices(): Promise<InvoiceSummaryDto[]> {
    return this.request<InvoiceSummaryDto[]>('/invoices/admin');
  }

  async getInvoiceById(id: string): Promise<InvoiceDto> {
    return this.request<InvoiceDto>(`/invoices/${id}`);
  }

  async generateInvoices(start: string, end: string): Promise<InvoiceDto[]> {
    return this.request<InvoiceDto[]>(`/invoices/generate?start=${start}&end=${end}`, {
      method: 'POST',
    });
  }

  // Business endpoints
  async getBusinesses(): Promise<BusinessDto[]> {
    return this.request<BusinessDto[]>('/businesses');
  }

  async getBusinessById(id: string): Promise<BusinessDto> {
    return this.request<BusinessDto>(`/businesses/${id}`);
  }

  async createBusiness(data: CreateBusinessDto): Promise<{
    business: BusinessDto;
    adminCredentials: { email: string; temporaryPassword: string };
  }> {
    return this.request<{
      business: BusinessDto;
      adminCredentials: { email: string; temporaryPassword: string };
    }>('/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBusiness(id: string, data: UpdateBusinessDto): Promise<BusinessDto> {
    return this.request<BusinessDto>(`/businesses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async disableBusiness(id: string): Promise<BusinessDto> {
    return this.request<BusinessDto>(`/businesses/${id}/disable`, {
      method: 'PATCH',
    });
  }
}

export const apiClient = new ApiClient();
