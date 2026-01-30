import {
  LoginRequestDto,
  LoginResponseDto,
  UserDto,
  EmployeeDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  OrderDto,
  InvoiceDto,
  InvoiceSummaryDto,
  ServiceDto,
  ServiceWithPacksDto,
  BusinessServiceDto,
  ActivateServiceDto,
  UpdateBusinessServiceDto,
  PackWithComponentsDto,
  BusinessDashboardSummaryDto,
  VariantDto,
  BusinessDto,
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

  async getMyBusiness(): Promise<BusinessDto> {
    return this.request<BusinessDto>('/business/me');
  }

  // Employee management endpoints (for BUSINESS_ADMIN)
  async getEmployees(): Promise<EmployeeDto[]> {
    return this.request<EmployeeDto[]>('/business/employees');
  }

  async createEmployee(data: CreateEmployeeDto): Promise<EmployeeDto> {
    return this.request<EmployeeDto>('/business/employees', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      }),
    });
  }

  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<EmployeeDto> {
    return this.request<EmployeeDto>(`/business/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        status: data.status,
      }),
    });
  }

  // Order endpoints
  async getBusinessOrders(): Promise<OrderDto[]> {
    return this.request<OrderDto[]>('/orders/business');
  }

  // Dashboard summary (orders for date, active employee count)
  async getDashboardSummary(date: string): Promise<BusinessDashboardSummaryDto> {
    return this.request<BusinessDashboardSummaryDto>(`/business/dashboard/summary?date=${encodeURIComponent(date)}`);
  }

  // Invoice endpoints
  async getBusinessInvoices(): Promise<InvoiceSummaryDto[]> {
    return this.request<InvoiceSummaryDto[]>('/invoices/business');
  }

  async getInvoice(id: string): Promise<InvoiceDto> {
    return this.request<InvoiceDto>(`/invoices/${id}`);
  }

  // Service endpoints
  async getServices(): Promise<ServiceDto[]> {
    return this.request<ServiceDto[]>('/services');
  }

  async getServiceById(id: string): Promise<ServiceWithPacksDto> {
    return this.request<ServiceWithPacksDto>(`/services/${id}`);
  }

  // Pack endpoints
  async getPackById(id: string): Promise<PackWithComponentsDto> {
    return this.request<PackWithComponentsDto>(`/packs/${id}`);
  }

  // Component endpoints
  async getComponentVariants(componentId: string): Promise<VariantDto[]> {
    return this.request<VariantDto[]>(`/components/${componentId}/variants`);
  }

  // Business service endpoints
  async getBusinessServices(businessId: string): Promise<BusinessServiceDto[]> {
    return this.request<BusinessServiceDto[]>(`/businesses/${businessId}/services`);
  }

  async getBusinessService(businessId: string, serviceId: string): Promise<BusinessServiceDto> {
    return this.request<BusinessServiceDto>(`/businesses/${businessId}/services/${serviceId}`);
  }

  async activateService(businessId: string, data: ActivateServiceDto): Promise<BusinessServiceDto> {
    return this.request<BusinessServiceDto>(`/businesses/${businessId}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBusinessService(
    businessId: string,
    serviceId: string,
    data: UpdateBusinessServiceDto,
  ): Promise<BusinessServiceDto> {
    return this.request<BusinessServiceDto>(`/businesses/${businessId}/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deactivateService(businessId: string, serviceId: string): Promise<void> {
    return this.request<void>(`/businesses/${businessId}/services/${serviceId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
