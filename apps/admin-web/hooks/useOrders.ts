'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { OrderDto } from '@contracts/core';

export function useOrders() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getAdminOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orders,
    loading,
    error,
    loadOrders,
    setError,
  };
}
