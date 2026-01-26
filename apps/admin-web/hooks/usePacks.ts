'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { PackDto, CreatePackDto, UpdatePackDto } from '@contracts/core';

export function usePacks() {
  const [packs, setPacks] = useState<PackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPacks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getPacks();
      setPacks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load packs');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPack = useCallback(async (data: CreatePackDto) => {
    try {
      setError('');
      await apiClient.createPack(data);
      await loadPacks();
    } catch (err: any) {
      setError(err.message || 'Failed to create pack');
      throw err;
    }
  }, [loadPacks]);

  const updatePack = useCallback(async (id: string, data: UpdatePackDto) => {
    try {
      setError('');
      await apiClient.updatePack(id, data);
      await loadPacks();
    } catch (err: any) {
      setError(err.message || 'Failed to update pack');
      throw err;
    }
  }, [loadPacks]);

  return {
    packs,
    loading,
    error,
    loadPacks,
    createPack,
    updatePack,
    setError,
  };
}
