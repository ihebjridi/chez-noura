import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import { PackStatisticsDto } from '@contracts/core';

export function usePackStatistics(packId: string | null) {
  const [statistics, setStatistics] = useState<PackStatisticsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!packId) {
      setStatistics(null);
      return;
    }

    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiClient.getPackStatistics(packId);
        setStatistics(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load pack statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [packId]);

  return { statistics, loading, error };
}
