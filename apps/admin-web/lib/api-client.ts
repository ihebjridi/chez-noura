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
  KitchenDetailedSummaryDto,
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
  UpdateComponentDto,
  ComponentPackUsageDto,
  VariantDto,
  CreateVariantDto,
  UpdateVariantDto,
  DailyMenuDto,
  DailyMenuWithDetailsDto,
  DailyMenuServiceDto,
  DailyMenuServiceVariantDto,
  CreateDailyMenuDto,
  AddPackToDailyMenuDto,
  AddVariantToDailyMenuDto,
  AddServiceToDailyMenuDto,
  AddVariantToDailyMenuServiceDto,
  PublishDailyMenuResponseDto,
  ActivityLogDto,
  EmployeeDto,
  UpdateEmployeeDto,
  PackStatisticsDto,
  ComponentStatisticsDto,
  VariantStatisticsDto,
  ServiceDto,
  CreateServiceDto,
  UpdateServiceDto,
  ServiceWithPacksDto,
  ServicePackDto,
  BusinessServiceDto,
  ActivateServiceDto,
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
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const error = JSON.parse(errorText);
            errorMessage = error.message || error.error || errorMessage;
          } catch {
            // If not JSON, use the text as error message
            errorMessage = errorText || errorMessage;
          }
        }
      } catch {
        // If we can't read the error, use the default message
      }
      throw new Error(errorMessage);
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
      const parsed = JSON.parse(text);
      // Validate that parsed data is not null/undefined for expected array responses
      if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) {
        return parsed;
      }
      return parsed;
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

  async getKitchenDetailedSummary(date: string): Promise<KitchenDetailedSummaryDto> {
    return this.request<KitchenDetailedSummaryDto>(`/ops/detailed-summary?date=${date}`);
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

  async generateBusinessInvoices(businessId: string, start?: string, end?: string): Promise<InvoiceDto[]> {
    const queryParams = new URLSearchParams();
    if (start) queryParams.append('start', start);
    if (end) queryParams.append('end', end);
    const queryString = queryParams.toString();
    const url = `/invoices/generate/business/${businessId}${queryString ? `?${queryString}` : ''}`;
    return this.request<InvoiceDto[]>(url, {
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

  async createBusiness(data: CreateBusinessDto, logoFile?: File): Promise<{
    business: BusinessDto;
    adminCredentials: { email: string; temporaryPassword: string };
  }> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    return this.request<{
      business: BusinessDto;
      adminCredentials: { email: string; temporaryPassword: string };
    }>('/businesses', {
      method: 'POST',
      body: formData,
    });
  }

  async updateBusiness(id: string, data: UpdateBusinessDto, logoFile?: File): Promise<BusinessDto> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    return this.request<BusinessDto>(`/businesses/${id}`, {
      method: 'PATCH',
      body: formData,
    });
  }

  async disableBusiness(id: string): Promise<BusinessDto> {
    return this.request<BusinessDto>(`/businesses/${id}/disable`, {
      method: 'PATCH',
    });
  }

  async enableBusiness(id: string): Promise<BusinessDto> {
    return this.request<BusinessDto>(`/businesses/${id}/enable`, {
      method: 'PATCH',
    });
  }

  async getBusinessEmployees(businessId: string): Promise<EmployeeDto[]> {
    return this.request<EmployeeDto[]>(`/businesses/${businessId}/employees`);
  }

  async updateBusinessEmployee(
    businessId: string,
    employeeId: string,
    data: UpdateEmployeeDto,
  ): Promise<EmployeeDto> {
    return this.request<EmployeeDto>(
      `/businesses/${businessId}/employees/${employeeId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );
  }

  async deleteBusinessEmployee(
    businessId: string,
    employeeId: string,
  ): Promise<void> {
    return this.request<void>(
      `/businesses/${businessId}/employees/${employeeId}`,
      { method: 'DELETE' },
    );
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

  async forceDeleteBusiness(id: string): Promise<void> {
    return this.request<void>(`/businesses/${id}/force`, {
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

  async removePackComponent(packId: string, componentId: string): Promise<void> {
    return this.request<void>(`/packs/${packId}/components/${componentId}`, {
      method: 'DELETE',
    });
  }

  // Service endpoints
  async getServices(): Promise<ServiceDto[]> {
    return this.request<ServiceDto[]>('/services');
  }

  async getServiceById(id: string): Promise<ServiceWithPacksDto> {
    return this.request<ServiceWithPacksDto>(`/services/${id}`);
  }

  async createService(data: CreateServiceDto): Promise<ServiceDto> {
    return this.request<ServiceDto>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: UpdateServiceDto): Promise<ServiceDto> {
    return this.request<ServiceDto>(`/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string): Promise<void> {
    return this.request<void>(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  async addPackToService(serviceId: string, packId: string): Promise<ServicePackDto> {
    return this.request<ServicePackDto>(`/services/${serviceId}/packs/${packId}`, {
      method: 'POST',
    });
  }

  async removePackFromService(serviceId: string, packId: string): Promise<void> {
    return this.request<void>(`/services/${serviceId}/packs/${packId}`, {
      method: 'DELETE',
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

  async updateComponent(id: string, data: UpdateComponentDto): Promise<ComponentDto> {
    return this.request<ComponentDto>(`/components/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteComponent(componentId: string): Promise<void> {
    return this.request<void>(`/components/${componentId}`, {
      method: 'DELETE',
    });
  }

  async getComponentPacks(componentId: string): Promise<ComponentPackUsageDto[]> {
    return this.request<ComponentPackUsageDto[]>(`/components/${componentId}/packs`);
  }

  // Variant endpoints
  async getComponentVariants(componentId: string): Promise<VariantDto[]> {
    return this.request<VariantDto[]>(`/components/${componentId}/variants`);
  }

  async createVariant(componentId: string, data: Omit<CreateVariantDto, 'componentId'>, imageFile?: File): Promise<VariantDto> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.request<VariantDto>(`/components/${componentId}/variants`, {
      method: 'POST',
      body: formData,
    });
  }

  async updateVariant(variantId: string, data: UpdateVariantDto, imageFile?: File): Promise<VariantDto> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.request<VariantDto>(`/variants/${variantId}`, {
      method: 'PATCH',
      body: formData,
    });
  }

  async deleteVariant(variantId: string): Promise<void> {
    return this.request<void>(`/variants/${variantId}`, {
      method: 'DELETE',
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

  async addServiceToDailyMenu(dailyMenuId: string, data: AddServiceToDailyMenuDto): Promise<DailyMenuServiceDto> {
    return this.request<DailyMenuServiceDto>(`/daily-menus/${dailyMenuId}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeServiceFromDailyMenu(dailyMenuId: string, serviceId: string): Promise<void> {
    return this.request<void>(`/daily-menus/${dailyMenuId}/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  async addVariantToDailyMenuService(
    dailyMenuId: string,
    serviceId: string,
    data: AddVariantToDailyMenuServiceDto,
  ): Promise<DailyMenuServiceVariantDto> {
    return this.request<DailyMenuServiceVariantDto>(`/daily-menus/${dailyMenuId}/services/${serviceId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeVariantFromDailyMenuService(
    dailyMenuId: string,
    serviceId: string,
    variantId: string,
  ): Promise<void> {
    return this.request<void>(`/daily-menus/${dailyMenuId}/services/${serviceId}/variants/${variantId}`, {
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

  async unlockDailyMenu(id: string): Promise<DailyMenuDto> {
    return this.request<DailyMenuDto>(`/daily-menus/${id}/unlock`, {
      method: 'POST',
    });
  }

  async unpublishDailyMenu(id: string): Promise<DailyMenuDto> {
    return this.request<DailyMenuDto>(`/daily-menus/${id}/unpublish`, {
      method: 'POST',
    });
  }

  async updateDailyMenuCutoffHour(id: string, cutoffHour: string): Promise<DailyMenuDto> {
    return this.request<DailyMenuDto>(`/daily-menus/${id}/cutoff-hour`, {
      method: 'PATCH',
      body: JSON.stringify({ cutoffHour }),
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

  // Statistics endpoints
  async getPackStatistics(packId: string): Promise<PackStatisticsDto> {
    return this.request<PackStatisticsDto>(`/packs/${packId}/statistics`);
  }

  async getComponentStatistics(componentId: string): Promise<ComponentStatisticsDto> {
    return this.request<ComponentStatisticsDto>(`/components/${componentId}/statistics`);
  }

  async getVariantStatistics(variantId: string): Promise<VariantStatisticsDto> {
    return this.request<VariantStatisticsDto>(`/variants/${variantId}/statistics`);
  }

  // Business Service endpoints
  async getBusinessServices(businessId: string): Promise<BusinessServiceDto[]> {
    return this.request<BusinessServiceDto[]>(`/businesses/${businessId}/services`);
  }

  async activateBusinessService(
    businessId: string,
    data: ActivateServiceDto,
  ): Promise<BusinessServiceDto> {
    return this.request<BusinessServiceDto>(`/businesses/${businessId}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deactivateBusinessService(businessId: string, serviceId: string): Promise<void> {
    return this.request<void>(`/businesses/${businessId}/services/${serviceId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
