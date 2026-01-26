'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { BusinessDto, CreateBusinessDto } from '@contracts/core';

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

  const createBusiness = useCallback(async (data: CreateBusinessDto) => {
    try {
      setError('');
      const result = await apiClient.createBusiness(data);
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

  return {
    businesses,
    loading,
    error,
    loadBusinesses,
    createBusiness,
    deleteBusiness,
    setError,
  };
}
