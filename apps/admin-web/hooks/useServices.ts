'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { ServiceDto, CreateServiceDto, UpdateServiceDto, ServiceWithPacksDto } from '@contracts/core';

export function useServices() {
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getServices();
      setServices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  const createService = useCallback(async (data: CreateServiceDto): Promise<ServiceDto> => {
    try {
      setError('');
      const newService = await apiClient.createService(data);
      await loadServices();
      return newService;
    } catch (err: any) {
      setError(err.message || 'Failed to create service');
      throw err;
    }
  }, [loadServices]);

  const updateService = useCallback(async (id: string, data: UpdateServiceDto) => {
    try {
      setError('');
      await apiClient.updateService(id, data);
      await loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to update service');
      throw err;
    }
  }, [loadServices]);

  const deleteService = useCallback(async (id: string) => {
    try {
      setError('');
      await apiClient.deleteService(id);
      await loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to delete service');
      throw err;
    }
  }, [loadServices]);

  return {
    services,
    loading,
    error,
    loadServices,
    createService,
    updateService,
    deleteService,
    setError,
  };
}
