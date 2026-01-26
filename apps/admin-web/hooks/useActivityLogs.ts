'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { ActivityLogDto } from '@contracts/core';

export function useActivityLogs() {
  const [activityLogs, setActivityLogs] = useState<ActivityLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadActivityLogs = useCallback(async (businessId: string, limit?: number) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getActivityLogsByBusiness(businessId, limit);
      setActivityLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity logs');
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    activityLogs,
    loading,
    error,
    loadActivityLogs,
    setError,
  };
}
