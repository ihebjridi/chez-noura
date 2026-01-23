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

  // Invoice endpoints
  async getBusinessInvoices(): Promise<InvoiceSummaryDto[]> {
    return this.request<InvoiceSummaryDto[]>('/invoices/business');
  }

  async getInvoice(id: string): Promise<InvoiceDto> {
    return this.request<InvoiceDto>(`/invoices/${id}`);
  }
}

export const apiClient = new ApiClient();
