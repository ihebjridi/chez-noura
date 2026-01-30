'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import { BusinessDto } from '@contracts/core';
import { useAuth } from '../contexts/auth-context';

export function useBusiness() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<BusinessDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBusiness = useCallback(async () => {
    if (!user?.businessId) {
      setBusiness(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiClient.getMyBusiness();
      setBusiness(data);
    } catch {
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  return { business, loading, loadBusiness };
}
