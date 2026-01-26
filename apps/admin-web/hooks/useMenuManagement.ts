'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import { DailyMenuDto, CreateDailyMenuDto, PublishDailyMenuResponseDto } from '@contracts/core';

export function useMenuManagement() {
  const [menus, setMenus] = useState<DailyMenuDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishWarnings, setPublishWarnings] = useState<string[]>([]);

  const loadMenus = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getDailyMenus();
      setMenus(data as DailyMenuDto[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load daily menus');
    } finally {
      setLoading(false);
    }
  }, []);

  const createMenu = useCallback(async (data: CreateDailyMenuDto) => {
    try {
      setError('');
      const menu = await apiClient.createDailyMenu(data);
      await loadMenus();
      return menu;
    } catch (err: any) {
      setError(err.message || 'Failed to create daily menu');
      throw err;
    }
  }, [loadMenus]);

  const publishMenu = useCallback(async (menuId: string): Promise<PublishDailyMenuResponseDto> => {
    try {
      setError('');
      setPublishWarnings([]);
      const result = await apiClient.publishDailyMenu(menuId);
      if (result.warnings && result.warnings.length > 0) {
        setPublishWarnings(result.warnings);
      }
      await loadMenus();
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to publish menu');
      throw err;
    }
  }, [loadMenus]);

  const lockMenu = useCallback(async (menuId: string) => {
    try {
      setError('');
      await apiClient.lockDailyMenu(menuId);
      await loadMenus();
    } catch (err: any) {
      setError(err.message || 'Failed to lock menu');
      throw err;
    }
  }, [loadMenus]);

  const deleteMenu = useCallback(async (menuId: string) => {
    try {
      setError('');
      await apiClient.deleteDailyMenu(menuId);
      await loadMenus();
    } catch (err: any) {
      setError(err.message || 'Failed to delete menu');
      throw err;
    }
  }, [loadMenus]);

  return {
    menus,
    loading,
    error,
    publishWarnings,
    loadMenus,
    createMenu,
    publishMenu,
    lockMenu,
    deleteMenu,
    setError,
    setPublishWarnings,
  };
}
