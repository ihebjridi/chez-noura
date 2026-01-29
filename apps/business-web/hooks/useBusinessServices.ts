'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../lib/api-client';
import { BusinessServiceDto, ActivateServiceDto, UpdateBusinessServiceDto, ServiceDto } from '@contracts/core';
import { useAuth } from '../contexts/auth-context';

export function useBusinessServices() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      setError(err.message || t('common.messages.failedToLoadServices'));
    } finally {
      setLoading(false);
    }
  }, [user?.businessId, t]);

  const activateService = useCallback(async (dto: ActivateServiceDto) => {
    if (!user?.businessId) throw new Error(t('common.messages.businessIdNotFound'));
    try {
      setError('');
      const result = await apiClient.activateService(user.businessId, dto);
      await loadBusinessServices();
      return result;
    } catch (err: any) {
      setError(err.message || t('common.messages.failedToActivateService'));
      throw err;
    }
  }, [user?.businessId, loadBusinessServices, t]);

  const updateService = useCallback(async (serviceId: string, dto: UpdateBusinessServiceDto) => {
    if (!user?.businessId) throw new Error(t('common.messages.businessIdNotFound'));
    try {
      setError('');
      const result = await apiClient.updateBusinessService(user.businessId, serviceId, dto);
      await loadBusinessServices();
      return result;
    } catch (err: any) {
      setError(err.message || t('common.messages.failedToUpdateService'));
      throw err;
    }
  }, [user?.businessId, loadBusinessServices, t]);

  const deactivateService = useCallback(async (serviceId: string) => {
    if (!user?.businessId) throw new Error(t('common.messages.businessIdNotFound'));
    try {
      setError('');
      await apiClient.deactivateService(user.businessId, serviceId);
      await loadBusinessServices();
    } catch (err: any) {
      setError(err.message || t('common.messages.failedToDeactivateService'));
      throw err;
    }
  }, [user?.businessId, loadBusinessServices, t]);

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
