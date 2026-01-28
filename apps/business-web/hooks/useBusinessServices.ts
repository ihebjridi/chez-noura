'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { BusinessServiceDto, ActivateServiceDto, UpdateBusinessServiceDto, ServiceDto } from '@contracts/core';
import { useAuth } from '../contexts/auth-context';

export function useBusinessServices() {
  const { user } = useAuth();
  const [businessServices, setBusinessServices] = useState<BusinessServiceDto[]>([]);
  const [allServices, setAllServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBusinessServices = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      setLoading(true);
      setError('');
      const [services, allServicesData] = await Promise.all([
        apiClient.getBusinessServices(user.businessId),
        apiClient.getServices(),
      ]);
      setBusinessServices(services);
      setAllServices(allServicesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [user?.businessId]);

  const activateService = useCallback(async (dto: ActivateServiceDto) => {
    if (!user?.businessId) throw new Error('Business ID not found');
    try {
      setError('');
      const result = await apiClient.activateService(user.businessId, dto);
      await loadBusinessServices();
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to activate service');
      throw err;
    }
  }, [user?.businessId, loadBusinessServices]);

  const updateService = useCallback(async (serviceId: string, dto: UpdateBusinessServiceDto) => {
    if (!user?.businessId) throw new Error('Business ID not found');
    try {
      setError('');
      const result = await apiClient.updateBusinessService(user.businessId, serviceId, dto);
      await loadBusinessServices();
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to update service');
      throw err;
    }
  }, [user?.businessId, loadBusinessServices]);

  const deactivateService = useCallback(async (serviceId: string) => {
    if (!user?.businessId) throw new Error('Business ID not found');
    try {
      setError('');
      await apiClient.deactivateService(user.businessId, serviceId);
      await loadBusinessServices();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate service');
      throw err;
    }
  }, [user?.businessId, loadBusinessServices]);

  return {
    businessServices,
    allServices,
    loading,
    error,
    loadBusinessServices,
    activateService,
    updateService,
    deactivateService,
    setError,
  };
}
