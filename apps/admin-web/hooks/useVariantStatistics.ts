import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import { VariantStatisticsDto } from '@contracts/core';

export function useVariantStatistics(variantId: string | null) {
  const [statistics, setStatistics] = useState<VariantStatisticsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!variantId) {
      setStatistics(null);
      return;
    }

    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiClient.getVariantStatistics(variantId);
        setStatistics(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load variant statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [variantId]);

  return { statistics, loading, error };
}
