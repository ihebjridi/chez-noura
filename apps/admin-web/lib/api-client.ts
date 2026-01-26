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
  PackDto,
  CreatePackDto,
  UpdatePackDto,
  PackWithComponentsDto,
  PackComponentDto,
  CreatePackComponentDto,
  ComponentDto,
  CreateComponentDto,
  VariantDto,
  CreateVariantDto,
  UpdateVariantDto,
  DailyMenuDto,
  DailyMenuWithDetailsDto,
  CreateDailyMenuDto,
  AddPackToDailyMenuDto,
  AddVariantToDailyMenuDto,
  PublishDailyMenuResponseDto,
  ActivityLogDto,
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

    // Handle empty responses (204 No Content or empty 200 OK)
    if (response.status === 204) {
      return undefined as T;
    }

    // Check if response has content before parsing JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      return undefined as T;
    }

    try {
      return JSON.parse(text);
    } catch {
      // If parsing fails, return undefined for void responses
      return undefined as T;
    }
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

  async generateBusinessAdminPassword(businessId: string): Promise<{
    email: string;
    temporaryPassword: string;
  }> {
    return this.request<{
      email: string;
      temporaryPassword: string;
    }>(`/businesses/${businessId}/generate-password`, {
      method: 'POST',
    });
  }

  async deleteBusiness(id: string): Promise<void> {
    return this.request<void>(`/businesses/${id}`, {
      method: 'DELETE',
    });
  }

  // Activity Log endpoints
  async getActivityLogsByBusiness(businessId: string, limit?: number): Promise<ActivityLogDto[]> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<ActivityLogDto[]>(`/activity-logs/business/${businessId}${query}`);
  }

  // Pack endpoints
  async getPacks(): Promise<PackDto[]> {
    return this.request<PackDto[]>('/packs');
  }

  async getPackById(id: string): Promise<PackWithComponentsDto> {
    return this.request<PackWithComponentsDto>(`/packs/${id}`);
  }

  async createPack(data: CreatePackDto): Promise<PackDto> {
    return this.request<PackDto>('/packs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePack(id: string, data: UpdatePackDto): Promise<PackDto> {
    return this.request<PackDto>(`/packs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getPackComponents(packId: string): Promise<PackComponentDto[]> {
    return this.request<PackComponentDto[]>(`/packs/${packId}/components`);
  }

  async addPackComponent(packId: string, data: CreatePackComponentDto): Promise<PackComponentDto> {
    return this.request<PackComponentDto>(`/packs/${packId}/components`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Component endpoints
  async getComponents(): Promise<ComponentDto[]> {
    return this.request<ComponentDto[]>('/components');
  }

  async createComponent(data: CreateComponentDto): Promise<ComponentDto> {
    return this.request<ComponentDto>('/components', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Variant endpoints
  async getComponentVariants(componentId: string): Promise<VariantDto[]> {
    return this.request<VariantDto[]>(`/components/${componentId}/variants`);
  }

  async createVariant(componentId: string, data: Omit<CreateVariantDto, 'componentId'>): Promise<VariantDto> {
    return this.request<VariantDto>(`/components/${componentId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVariant(variantId: string, data: UpdateVariantDto): Promise<VariantDto> {
    return this.request<VariantDto>(`/variants/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Daily Menu endpoints
  async getDailyMenus(date?: string): Promise<DailyMenuDto[] | DailyMenuWithDetailsDto[]> {
    const query = date ? `?date=${date}` : '';
    return this.request<DailyMenuDto[] | DailyMenuWithDetailsDto[]>(`/daily-menus${query}`);
  }

  async getDailyMenuById(id: string): Promise<DailyMenuWithDetailsDto> {
    return this.request<DailyMenuWithDetailsDto>(`/daily-menus/${id}`);
  }

  async createDailyMenu(data: CreateDailyMenuDto): Promise<DailyMenuDto> {
    return this.request<DailyMenuDto>('/daily-menus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addPackToDailyMenu(dailyMenuId: string, data: AddPackToDailyMenuDto): Promise<any> {
    return this.request<any>(`/daily-menus/${dailyMenuId}/packs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addVariantToDailyMenu(dailyMenuId: string, data: AddVariantToDailyMenuDto): Promise<any> {
    return this.request<any>(`/daily-menus/${dailyMenuId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeVariantFromDailyMenu(dailyMenuId: string, variantId: string): Promise<void> {
    return this.request<void>(`/daily-menus/${dailyMenuId}/variants/${variantId}`, {
      method: 'DELETE',
    });
  }

  async publishDailyMenu(id: string): Promise<PublishDailyMenuResponseDto> {
    return this.request<PublishDailyMenuResponseDto>(`/daily-menus/${id}/publish`, {
      method: 'POST',
    });
  }

  async lockDailyMenu(id: string): Promise<DailyMenuDto> {
    return this.request<DailyMenuDto>(`/daily-menus/${id}/lock`, {
      method: 'POST',
    });
  }

  async deleteDailyMenu(id: string): Promise<void> {
    try {
      await this.request<void>(`/daily-menus/${id}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      // Re-throw with a more user-friendly message if it's a 404
      if (error.message?.includes('not found')) {
        throw new Error('Daily menu not found or already deleted');
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
