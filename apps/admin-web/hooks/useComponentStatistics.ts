import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import { ComponentStatisticsDto } from '@contracts/core';

export function useComponentStatistics(componentId: string | null) {
  const [statistics, setStatistics] = useState<ComponentStatisticsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!componentId) {
      setStatistics(null);
      return;
    }

    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiClient.getComponentStatistics(componentId);
        setStatistics(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load component statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [componentId]);

  return { statistics, loading, error };
}
