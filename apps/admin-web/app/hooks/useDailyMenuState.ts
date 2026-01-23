'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../lib/api-client';
import {
  DailyMenuDto,
  DailyMenuWithDetailsDto,
  PackDto,
  PackWithComponentsDto,
  VariantDto,
} from '@contracts/core';

interface DashboardState {
  selectedDate: string;
  selectedMenuId: string | null;
  sidePanelOpen: boolean;
  sidePanelSection: 'packs' | 'variants' | null;
  expandedPacks: Set<string>;
  expandedVariants: Set<string>;
}

export function useDailyMenuState() {
  const today = new Date().toISOString().split('T')[0];
  
  const [state, setState] = useState<DashboardState>({
    selectedDate: today,
    selectedMenuId: null,
    sidePanelOpen: true, // Open by default on desktop
    sidePanelSection: 'packs',
    expandedPacks: new Set(),
    expandedVariants: new Set(),
  });

  const [dailyMenus, setDailyMenus] = useState<DailyMenuDto[]>([]);
  const [dailyMenu, setDailyMenu] = useState<DailyMenuWithDetailsDto | null>(null);
  const [allPacks, setAllPacks] = useState<PackDto[]>([]);
  const [packDetails, setPackDetails] = useState<Map<string, PackWithComponentsDto>>(new Map());
  const [foodComponentVariants, setFoodComponentVariants] = useState<Map<string, VariantDto[]>>(new Map());
  const [variantStocks, setVariantStocks] = useState<Map<string, number>>(new Map());
  const [updatingVariants, setUpdatingVariants] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishWarnings, setPublishWarnings] = useState<string[]>([]);

  // Load daily menus list
  const loadDailyMenus = useCallback(async () => {
    try {
      const data = await apiClient.getDailyMenus();
      setDailyMenus(data);
      
      // Auto-select menu for selected date
      const menuForDate = data.find((m) => m.date === state.selectedDate);
      if (menuForDate) {
        setState((prev) => ({ ...prev, selectedMenuId: menuForDate.id }));
      } else {
        setState((prev) => ({ ...prev, selectedMenuId: null }));
        setDailyMenu(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load daily menus');
    }
  }, [state.selectedDate]);

  // Load daily menu details
  const loadDailyMenuDetails = useCallback(async (menuId: string) => {
    try {
      setLoading(true);
      setError('');
      const menuData = await apiClient.getDailyMenuById(menuId);
      setDailyMenu(menuData);

      // Load pack details and variants
      const packDetailsMap = new Map<string, PackWithComponentsDto>();
      const foodComponentIds = new Set<string>();

      for (const pack of allPacks) {
        try {
          const packDetail = await apiClient.getPackById(pack.id);
          packDetailsMap.set(pack.id, packDetail);
          packDetail.components.forEach((foodComp) => foodComponentIds.add(foodComp.componentId));
        } catch (err) {
          console.error(`Failed to load pack ${pack.id}:`, err);
        }
      }

      setPackDetails(packDetailsMap);

      const variantsMap = new Map<string, VariantDto[]>();
      for (const foodComponentId of foodComponentIds) {
        try {
          const variants = await apiClient.getComponentVariants(foodComponentId);
          variantsMap.set(foodComponentId, variants);
        } catch (err) {
          console.error(`Failed to load variants for food component ${foodComponentId}:`, err);
        }
      }
      setFoodComponentVariants(variantsMap);

      const stocksMap = new Map<string, number>();
      menuData.variants.forEach((v) => {
        stocksMap.set(v.variantId, v.initialStock);
      });
      setVariantStocks(stocksMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load daily menu');
    } finally {
      setLoading(false);
    }
  }, [allPacks]);

  // Load all packs
  const loadPacks = useCallback(async () => {
    try {
      const packsData = await apiClient.getPacks();
      setAllPacks(packsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load packs');
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([loadPacks(), loadDailyMenus()]);
      setLoading(false);
    };
    initialize();
  }, []);

  // Load menu details when selected menu changes
  useEffect(() => {
    if (state.selectedMenuId) {
      loadDailyMenuDetails(state.selectedMenuId);
    } else {
      setDailyMenu(null);
      setLoading(false);
    }
  }, [state.selectedMenuId, loadDailyMenuDetails]);

  // Reload menus when date changes
  useEffect(() => {
    loadDailyMenus();
  }, [state.selectedDate, loadDailyMenus]);

  const setSelectedDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, selectedDate: date }));
  }, []);

  const setSelectedMenuId = useCallback((menuId: string | null) => {
    setState((prev) => ({ ...prev, selectedMenuId: menuId }));
  }, []);

  const toggleSidePanel = useCallback((section?: 'packs' | 'variants' | null) => {
    setState((prev) => ({
      ...prev,
      sidePanelOpen: section !== undefined ? section !== null : !prev.sidePanelOpen,
      sidePanelSection: section !== undefined ? section : prev.sidePanelSection,
    }));
  }, []);

  const togglePackExpanded = useCallback((packId: string) => {
    setState((prev) => {
      const newSet = new Set(prev.expandedPacks);
      if (newSet.has(packId)) {
        newSet.delete(packId);
      } else {
        newSet.add(packId);
      }
      return { ...prev, expandedPacks: newSet };
    });
  }, []);

  const toggleVariantExpanded = useCallback((variantId: string) => {
    setState((prev) => {
      const newSet = new Set(prev.expandedVariants);
      if (newSet.has(variantId)) {
        newSet.delete(variantId);
      } else {
        newSet.add(variantId);
      }
      return { ...prev, expandedVariants: newSet };
    });
  }, []);

  return {
    // State
    state,
    dailyMenus,
    dailyMenu,
    allPacks,
    packDetails,
    foodComponentVariants,
    variantStocks,
    updatingVariants,
    loading,
    error,
    publishWarnings,
    
    // Actions
    setSelectedDate,
    setSelectedMenuId,
    toggleSidePanel,
    togglePackExpanded,
    toggleVariantExpanded,
    setError,
    setPublishWarnings,
    setUpdatingVariants,
    setVariantStocks,
    setDailyMenu,
    setPackDetails,
    setFoodComponentVariants,
    loadDailyMenus,
    loadDailyMenuDetails,
    loadPacks,
  };
}
