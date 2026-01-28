'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../lib/api-client';
import {
  DailyMenuDto,
  DailyMenuWithDetailsDto,
  PackDto,
  PackWithComponentsDto,
  VariantDto,
  ServiceDto,
  ServiceWithPacksDto,
  DailyMenuStatus,
} from '@contracts/core';
import { getTodayISO, getTomorrowISO } from '../../lib/date-utils';

interface DashboardState {
  selectedDate: string;
  selectedMenuId: string | null;
  sidePanelOpen: boolean;
  sidePanelSection: 'services' | 'variants' | null;
  expandedServices: Set<string>;
  expandedVariants: Set<string>;
}

export function useDailyMenuState() {
  const today = getTodayISO();
  
  const [state, setState] = useState<DashboardState>({
    selectedDate: today,
    selectedMenuId: null,
    sidePanelOpen: true, // Open by default on desktop
    sidePanelSection: 'services',
    expandedServices: new Set(),
    expandedVariants: new Set(),
  });

  const [dailyMenus, setDailyMenus] = useState<DailyMenuDto[]>([]);
  const [dailyMenu, setDailyMenu] = useState<DailyMenuWithDetailsDto | null>(null);
  const [allServices, setAllServices] = useState<ServiceDto[]>([]);
  const [serviceDetails, setServiceDetails] = useState<Map<string, ServiceWithPacksDto>>(new Map());
  const [foodComponentVariants, setFoodComponentVariants] = useState<Map<string, VariantDto[]>>(new Map());
  const [variantStocks, setVariantStocks] = useState<Map<string, number>>(new Map());
  const [updatingVariants, setUpdatingVariants] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishWarnings, setPublishWarnings] = useState<string[]>([]);

  // Load daily menus list
  // This function loads ALL menus regardless of status (DRAFT, PUBLISHED, LOCKED)
  // Note: targetDate parameter should always be provided to avoid using stale state.selectedDate
  const loadDailyMenus = useCallback(async (targetDate?: string) => {
    try {
      // Always load all menus for calendar display first
      // Backend returns ALL menus without status filtering
      const allMenusData = await apiClient.getDailyMenus();
      const allMenus = allMenusData as DailyMenuDto[];
      setDailyMenus(allMenus);
      
      // Only find menu if targetDate is provided
      // If no targetDate, we're just refreshing the menu list for the calendar
      if (targetDate) {
        // Normalize dates to ensure exact match (YYYY-MM-DD format)
        const normalizedDateToUse = targetDate.split('T')[0]; // In case there's time component
        
        const menuForDate = allMenus.find((m) => {
          // Normalize menu date to ensure exact match
          const normalizedMenuDate = m.date.split('T')[0];
          return normalizedMenuDate === normalizedDateToUse;
        });
        
        if (menuForDate) {
          // Menu exists in the calendar list - always use this menu's ID
          // This ensures 100% consistency: calendar shows this menu, so we load this menu
          // Works for ALL statuses: DRAFT, PUBLISHED, LOCKED
          setState((prev) => ({ ...prev, selectedMenuId: menuForDate.id }));
          // The useEffect will trigger loadDailyMenuDetails with the correct ID
          // This guarantees we load the exact menu that the calendar displays
        } else {
          // Menu not found for this date in the calendar
          setState((prev) => ({ ...prev, selectedMenuId: null }));
          setDailyMenu(null);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load daily menus';
      console.error(`[useDailyMenuState] Error loading menus:`, err);
      setError(errorMessage);
    }
  }, []); // No dependencies - we always pass the date as a parameter

  // Load daily menu details
  // This function loads menus regardless of status (DRAFT, PUBLISHED, LOCKED)
  const loadDailyMenuDetails = useCallback(async (menuId: string) => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`[useDailyMenuState] Loading menu details for ID: ${menuId}`);
      const menuData = await apiClient.getDailyMenuById(menuId);
      
      if (!menuData) {
        throw new Error(`Menu with ID ${menuId} not found`);
      }
      
      console.log(`[useDailyMenuState] Menu loaded successfully. Status: ${menuData.status}, Date: ${menuData.date}`);
      setDailyMenu(menuData);

      // Load service details and variants
      const serviceDetailsMap = new Map<string, ServiceWithPacksDto>();
      const foodComponentIds = new Set<string>();

      // Load details for services in the menu
      for (const menuService of menuData.services || []) {
        try {
          const serviceDetail = await apiClient.getServiceById(menuService.serviceId);
          serviceDetailsMap.set(menuService.serviceId, serviceDetail);
          
          // Collect component IDs from all packs in the service
          for (const servicePack of serviceDetail.packs) {
            try {
              const packDetail = await apiClient.getPackById(servicePack.packId);
              packDetail.components.forEach((foodComp) => foodComponentIds.add(foodComp.componentId));
            } catch (err) {
              console.error(`[useDailyMenuState] Failed to load pack ${servicePack.packId}:`, err);
            }
          }
        } catch (err) {
          console.error(`[useDailyMenuState] Failed to load service ${menuService.serviceId}:`, err);
        }
      }

      setServiceDetails(serviceDetailsMap);

      // Load variants for all components
      const variantsMap = new Map<string, VariantDto[]>();
      for (const foodComponentId of foodComponentIds) {
        try {
          const variants = await apiClient.getComponentVariants(foodComponentId);
          variantsMap.set(foodComponentId, variants);
        } catch (err) {
          console.error(`[useDailyMenuState] Failed to load variants for food component ${foodComponentId}:`, err);
        }
      }
      setFoodComponentVariants(variantsMap);

      // Set variant stocks from both pack-level and service-level variants
      const stocksMap = new Map<string, number>();
      // Pack-level variants (for backward compatibility)
      menuData.variants.forEach((v) => {
        stocksMap.set(v.variantId, v.initialStock);
      });
      // Service-level variants
      for (const menuService of menuData.services || []) {
        menuService.variants.forEach((v) => {
          // Use the higher stock if variant exists in both
          const existing = stocksMap.get(v.variantId);
          stocksMap.set(v.variantId, existing ? Math.max(existing, v.initialStock) : v.initialStock);
        });
      }
      setVariantStocks(stocksMap);
      
      console.log(`[useDailyMenuState] Menu details loaded successfully for ${menuData.status} menu`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load daily menu';
      console.error(`[useDailyMenuState] Error loading menu ${menuId}:`, err);
      setError(errorMessage);
      // Clear the menu on error to prevent showing stale data
      setDailyMenu(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all services
  const loadServices = useCallback(async () => {
    try {
      const servicesData = await apiClient.getServices();
      setAllServices(servicesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load services');
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const initialDate = state.selectedDate;
      // Load menus and find menu for initial selected date
      await Promise.all([loadServices(), loadDailyMenus(initialDate)]);
      setLoading(false);
    };
    initialize();
  }, []);

  // Load menu details when selected menu changes
  // This effect triggers for ALL menu statuses (DRAFT, PUBLISHED, LOCKED)
  useEffect(() => {
    if (state.selectedMenuId) {
      // Only load details if we don't already have this menu loaded
      // This ensures draft menus are loaded just like published/locked menus
      if (!dailyMenu || dailyMenu.id !== state.selectedMenuId) {
        console.log(`[useDailyMenuState] useEffect: Loading menu ${state.selectedMenuId} (current menu: ${dailyMenu?.id || 'none'})`);
        loadDailyMenuDetails(state.selectedMenuId);
      } else {
        console.log(`[useDailyMenuState] useEffect: Menu ${state.selectedMenuId} already loaded, skipping`);
      }
    } else {
      console.log(`[useDailyMenuState] useEffect: No menu selected, clearing menu data`);
      setDailyMenu(null);
      setLoading(false);
    }
  }, [state.selectedMenuId, loadDailyMenuDetails, dailyMenu]);

  // Reload menus when date changes
  useEffect(() => {
    // Always pass the current selectedDate explicitly to avoid closure issues
    // This ensures that when Today/Tomorrow buttons are clicked, we load menus for that date
    const currentDate = state.selectedDate;
    
    // Load menus for the selected date
    // loadDailyMenus will find the menu for this date and set selectedMenuId
    loadDailyMenus(currentDate);
  }, [state.selectedDate, loadDailyMenus]);

  const setSelectedDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, selectedDate: date }));
  }, []);

  const setSelectedMenuId = useCallback((menuId: string | null) => {
    setState((prev) => ({ ...prev, selectedMenuId: menuId }));
  }, []);

  const toggleSidePanel = useCallback((section?: 'services' | 'variants' | null) => {
    setState((prev) => ({
      ...prev,
      sidePanelOpen: section !== undefined ? section !== null : !prev.sidePanelOpen,
      sidePanelSection: section !== undefined ? section : prev.sidePanelSection,
    }));
  }, []);

  const toggleServiceExpanded = useCallback((serviceId: string) => {
    setState((prev) => {
      const newSet = new Set(prev.expandedServices);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return { ...prev, expandedServices: newSet };
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

  // Helper functions for menu categorization
  const getPastPublishedMenus = useCallback((): DailyMenuDto[] => {
    const today = getTodayISO();
    return dailyMenus.filter(
      (menu) => menu.date < today && (menu.status === DailyMenuStatus.PUBLISHED || menu.status === DailyMenuStatus.LOCKED)
    );
  }, [dailyMenus]);

  const getCurrentPublishedMenu = useCallback((): DailyMenuDto | null => {
    const today = getTodayISO();
    return dailyMenus.find((menu) => menu.date === today && menu.status === DailyMenuStatus.PUBLISHED) || null;
  }, [dailyMenus]);

  const getTomorrowMenu = useCallback((): DailyMenuDto | null => {
    const tomorrow = getTomorrowISO();
    return dailyMenus.find((menu) => menu.date === tomorrow) || null;
  }, [dailyMenus]);

  const findMenuByDate = useCallback(
    (date: string): DailyMenuDto | null => {
      return dailyMenus.find((menu) => menu.date === date) || null;
    },
    [dailyMenus]
  );

  const getMostRecentPastMenu = useCallback((): DailyMenuDto | null => {
    const pastMenus = getPastPublishedMenus();
    if (pastMenus.length === 0) return null;
    // Sort by date descending and return the most recent
    return pastMenus.sort((a, b) => (b.date > a.date ? 1 : -1))[0] || null;
  }, [getPastPublishedMenus]);

  const navigateToPastMenu = useCallback(() => {
    const pastMenu = getMostRecentPastMenu();
    if (pastMenu) {
      setSelectedDate(pastMenu.date);
    }
  }, [getMostRecentPastMenu, setSelectedDate]);

  return {
    // State
    state,
    dailyMenus,
    dailyMenu,
    allServices,
    serviceDetails,
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
    toggleServiceExpanded,
    toggleVariantExpanded,
    setError,
    setPublishWarnings,
    setUpdatingVariants,
    setVariantStocks,
    setDailyMenu,
    setServiceDetails,
    setFoodComponentVariants,
    loadDailyMenus,
    loadDailyMenuDetails,
    loadServices,
    
    // Helper functions
    getPastPublishedMenus,
    getCurrentPublishedMenu,
    getTomorrowMenu,
    findMenuByDate,
    getMostRecentPastMenu,
    navigateToPastMenu,
  };
}
