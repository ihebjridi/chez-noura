'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { BusinessDto, CreateBusinessDto, EmployeeDto, BusinessServiceDto, ActivateServiceDto } from '@contracts/core';

export function useBusinesses() {
  const [businesses, setBusinesses] = useState<BusinessDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getBusinesses();
      setBusinesses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBusiness = useCallback(async (data: CreateBusinessDto, logoFile?: File) => {
    try {
      setError('');
      const result = await apiClient.createBusiness(data, logoFile);
      await loadBusinesses();
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to create business');
      throw err;
    }
  }, [loadBusinesses]);

  const deleteBusiness = useCallback(async (id: string) => {
    try {
      setError('');
      await apiClient.deleteBusiness(id);
      await loadBusinesses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete business');
      throw err;
    }
  }, [loadBusinesses]);

  const disableBusiness = useCallback(async (id: string) => {
    try {
      setError('');
      await apiClient.disableBusiness(id);
      await loadBusinesses();
    } catch (err: any) {
      setError(err.message || 'Failed to disable business');
      throw err;
    }
  }, [loadBusinesses]);

  const enableBusiness = useCallback(async (id: string) => {
    try {
      setError('');
      await apiClient.enableBusiness(id);
      await loadBusinesses();
    } catch (err: any) {
      setError(err.message || 'Failed to enable business');
      throw err;
    }
  }, [loadBusinesses]);

  const forceDeleteBusiness = useCallback(async (id: string) => {
    try {
      setError('');
      await apiClient.forceDeleteBusiness(id);
      await loadBusinesses();
    } catch (err: any) {
      setError(err.message || 'Failed to force delete business');
      throw err;
    }
  }, [loadBusinesses]);

  const getBusinessEmployees = useCallback(async (businessId: string): Promise<EmployeeDto[]> => {
    try {
      setError('');
      return await apiClient.getBusinessEmployees(businessId);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
      throw err;
    }
  }, []);

  const getBusinessServices = useCallback(async (businessId: string): Promise<BusinessServiceDto[]> => {
    try {
      setError('');
      return await apiClient.getBusinessServices(businessId);
    } catch (err: any) {
      setError(err.message || 'Failed to load business services');
      throw err;
    }
  }, []);

  const activateBusinessService = useCallback(async (businessId: string, data: ActivateServiceDto): Promise<BusinessServiceDto> => {
    try {
      setError('');
      return await apiClient.activateBusinessService(businessId, data);
    } catch (err: any) {
      setError(err.message || 'Failed to activate service');
      throw err;
    }
  }, []);

  const deactivateBusinessService = useCallback(async (businessId: string, serviceId: string): Promise<void> => {
    try {
      setError('');
      await apiClient.deactivateBusinessService(businessId, serviceId);
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate service');
      throw err;
    }
  }, []);

  return {
    businesses,
    loading,
    error,
    loadBusinesses,
    createBusiness,
    deleteBusiness,
    disableBusiness,
    enableBusiness,
    forceDeleteBusiness,
    getBusinessEmployees,
    getBusinessServices,
    activateBusinessService,
    deactivateBusinessService,
    setError,
  };
}
