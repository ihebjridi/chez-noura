'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { ComponentDto, CreateComponentDto } from '@contracts/core';

export function useFoodComponents() {
  const [components, setComponents] = useState<ComponentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadComponents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getComponents();
      setComponents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load food components');
    } finally {
      setLoading(false);
    }
  }, []);

  const createComponent = useCallback(async (data: CreateComponentDto) => {
    try {
      setError('');
      await apiClient.createComponent(data);
      await loadComponents();
    } catch (err: any) {
      setError(err.message || 'Failed to create food component');
      throw err;
    }
  }, [loadComponents]);

  const deleteComponent = useCallback(async (componentId: string) => {
    try {
      setError('');
      await apiClient.deleteComponent(componentId);
      await loadComponents();
    } catch (err: any) {
      setError(err.message || 'Failed to delete food component');
      throw err;
    }
  }, [loadComponents]);

  return {
    components,
    loading,
    error,
    loadComponents,
    createComponent,
    deleteComponent,
    setError,
  };
}
