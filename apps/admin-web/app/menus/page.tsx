'use client';

import { useState } from 'react';
import { QuickActionsBar } from '../../components/menus/QuickActionsBar';
import { DailyMenuView } from '../../components/menus/DailyMenuView';
import { MenuCalendar } from '../../components/menus/MenuCalendar';
import { SidePanel } from '../../components/menus/SidePanel';
import { useDailyMenuState } from '../hooks/useDailyMenuState';
import { apiClient } from '../../lib/api-client';
import { PublishDailyMenuResponseDto, DailyMenuStatus } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';
import { StickyHeader } from '../../components/layouts/StickyHeader';
import { SplitPane } from '../../components/layouts/SplitPane';
import { Menu } from 'lucide-react';
import { getTodayISO, getTomorrowISO } from '../../lib/date-utils';

export default function MenusPage() {
  const {
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
    setSelectedDate,
    setSelectedMenuId,
    toggleSidePanel,
    toggleServiceExpanded,
    setError,
    setPublishWarnings,
    setUpdatingVariants,
    setVariantStocks,
    setDailyMenu,
    setServiceDetails,
    setFoodComponentVariants,
    loadDailyMenus,
    loadDailyMenuDetails,
  } = useDailyMenuState();

  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteWithOrdersConfirm, setShowDeleteWithOrdersConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['services']));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const today = getTodayISO();
  const tomorrow = getTomorrowISO();
  
  // Determine if current menu is read-only (past published menu)
  const isReadOnly = dailyMenu
    ? state.selectedDate < today && 
      (dailyMenu.status === DailyMenuStatus.PUBLISHED || dailyMenu.status === DailyMenuStatus.LOCKED)
    : false;

  // Create daily menu if it doesn't exist
  const handleCreateDailyMenu = async () => {
    try {
      setError('');
      const newMenu = await apiClient.createDailyMenu({ 
        date: state.selectedDate,
      });
      setSelectedMenuId(newMenu.id);
      // Reload menus for the current selected date to include the newly created menu
      await loadDailyMenus(state.selectedDate);
    } catch (err: any) {
      setError(err.message || 'Failed to create daily menu');
    }
  };

  // Service toggle handler
  const handleServiceToggle = async (serviceId: string, checked: boolean) => {
    if (!dailyMenu || isReadOnly) return;

    if (checked && !dailyMenu.services.some((s) => s.serviceId === serviceId)) {
      const service = allServices.find((s) => s.id === serviceId);
      if (service) {
        // Optimistically add service
        setDailyMenu((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            services: [
              ...prev.services,
              {
                id: `temp-${serviceId}`,
                dailyMenuId: prev.id,
                serviceId: service.id,
                serviceName: service.name,
                serviceDescription: service.description,
                packs: [],
                variants: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        });

        try {
          setError('');
          const result = await apiClient.addServiceToDailyMenu(dailyMenu.id, { serviceId });

          // Update the menu with the real service data
          setDailyMenu((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              services: prev.services.map((s) =>
                s.serviceId === serviceId && s.id.startsWith('temp-') ? result : s
              ),
            };
          });

          // Load service details and pack details
          if (!serviceDetails.has(serviceId)) {
            try {
              const serviceDetail = await apiClient.getServiceById(serviceId);
              setServiceDetails((prev) => {
                const newMap = new Map(prev);
                newMap.set(serviceId, serviceDetail);
                return newMap;
              });

              // Load variants for all components in all packs of the service
              const foodComponentIds = new Set<string>();
              for (const servicePack of serviceDetail.packs) {
                try {
                  const packDetail = await apiClient.getPackById(servicePack.packId);
                  packDetail.components.forEach((foodComp) => foodComponentIds.add(foodComp.componentId));
                } catch (err) {
                  console.error(`Failed to load pack ${servicePack.packId}:`, err);
                }
              }

              const variantsMap = new Map(foodComponentVariants);
              for (const foodComponentId of foodComponentIds) {
                if (!variantsMap.has(foodComponentId)) {
                  try {
                    const variants = await apiClient.getComponentVariants(foodComponentId);
                    variantsMap.set(foodComponentId, variants);
                  } catch (err) {
                    console.error(`Failed to load variants for food component ${foodComponentId}:`, err);
                  }
                }
              }
              setFoodComponentVariants(variantsMap);
            } catch (err) {
              console.error(`Failed to load service details:`, err);
            }
          }
        } catch (err: any) {
          setError(err.message || 'Failed to add service');
          setDailyMenu((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              services: prev.services.filter((s) => !(s.serviceId === serviceId && s.id.startsWith('temp-'))),
            };
          });
        }
      }
    } else if (!checked && dailyMenu.services.some((s) => s.serviceId === serviceId)) {
      // Only allow removal from DRAFT menus
      if (dailyMenu.status !== DailyMenuStatus.DRAFT) {
        setError('Service cannot be removed once the menu is published. This is a backend limitation.');
        return;
      }

      try {
        setError('');
        await apiClient.removeServiceFromDailyMenu(dailyMenu.id, serviceId);
        setDailyMenu((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            services: prev.services.filter((s) => s.serviceId !== serviceId),
          };
        });
      } catch (err: any) {
        setError(err.message || 'Failed to remove service');
      }
    }
  };

  // Service variant toggle handler
  const handleServiceVariantToggle = async (
    serviceId: string,
    variantId: string,
    checked: boolean,
    componentId: string,
  ) => {
    if (!dailyMenu || isReadOnly) return;

    const menuService = dailyMenu.services.find((s) => s.serviceId === serviceId);
    if (!menuService) {
      setError('Service is not added to this menu');
      return;
    }

    if (checked && !menuService.variants.some((v) => v.variantId === variantId)) {
      const stock = variantStocks.get(variantId) || 50;
      if (stock <= 0) {
        setError('Please enter a stock quantity (greater than 0) before adding the variant');
        return;
      }

      const variants = foodComponentVariants.get(componentId) || [];
      const variant = variants.find((v) => v.id === variantId);

      if (!variant) {
        setError('Variant not found');
        return;
      }

      setUpdatingVariants((prev) => new Set(prev).add(variantId));
      
      // Optimistically add variant
      setDailyMenu((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: prev.services.map((s) =>
            s.serviceId === serviceId
              ? {
                  ...s,
                  variants: [
                    ...s.variants,
                    {
                      id: `temp-${variantId}`,
                      dailyMenuServiceId: s.id,
                      variantId: variant.id,
                      variantName: variant.name,
                      componentId: componentId,
                      componentName: variant.componentName,
                      initialStock: stock,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    },
                  ],
                }
              : s
          ),
        };
      });

      try {
        setError('');
        const result = await apiClient.addVariantToDailyMenuService(dailyMenu.id, serviceId, {
          variantId,
          initialStock: stock,
        });

        setDailyMenu((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            services: prev.services.map((s) =>
              s.serviceId === serviceId
                ? {
                    ...s,
                    variants: s.variants.map((v) =>
                      v.variantId === variantId && v.id.startsWith('temp-') ? result : v
                    ),
                  }
                : s
            ),
          };
        });
      } catch (err: any) {
        setError(err.message || 'Failed to add variant');
        setDailyMenu((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            services: prev.services.map((s) =>
              s.serviceId === serviceId
                ? {
                    ...s,
                    variants: s.variants.filter((v) => !(v.variantId === variantId && v.id.startsWith('temp-'))),
                  }
                : s
            ),
          };
        });
      } finally {
        setUpdatingVariants((prev) => {
          const newSet = new Set(prev);
          newSet.delete(variantId);
          return newSet;
        });
      }
    } else if (!checked && menuService.variants.some((v) => v.variantId === variantId)) {
      // Only allow removal from DRAFT menus
      if (dailyMenu.status !== DailyMenuStatus.DRAFT) {
        setError('Variant cannot be removed once the menu is published. This is a backend limitation.');
        return;
      }

      setUpdatingVariants((prev) => new Set(prev).add(variantId));
      setDailyMenu((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: prev.services.map((s) =>
            s.serviceId === serviceId
              ? {
                  ...s,
                  variants: s.variants.filter((v) => v.variantId !== variantId),
                }
              : s
          ),
        };
      });

      try {
        setError('');
        await apiClient.removeVariantFromDailyMenuService(dailyMenu.id, serviceId, variantId);
      } catch (err: any) {
        setError(err.message || 'Failed to remove variant');
        // Revert the UI change on error
        loadDailyMenuDetails(dailyMenu.id);
      } finally {
        setUpdatingVariants((prev) => {
          const newSet = new Set(prev);
          newSet.delete(variantId);
          return newSet;
        });
      }
    }
  };

  // Stock change handler for service variants
  const handleServiceVariantStockChange = (
    serviceId: string,
    variantId: string,
    stock: number,
    isExisting: boolean,
  ) => {
    if (isReadOnly) return;
    
    setVariantStocks((prev) => {
      const newMap = new Map(prev);
      newMap.set(variantId, stock);
      return newMap;
    });

    if (isExisting && dailyMenu) {
      setDailyMenu((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          services: prev.services.map((s) =>
            s.serviceId === serviceId
              ? {
                  ...s,
                  variants: s.variants.map((v) =>
                    v.variantId === variantId ? { ...v, initialStock: stock } : v
                  ),
                }
              : s
          ),
        };
      });
    }
  };

  // Publish handler
  const handlePublish = async () => {
    if (!dailyMenu) return;

    try {
      setError('');
      const response: PublishDailyMenuResponseDto = await apiClient.publishDailyMenu(dailyMenu.id);
      setPublishWarnings(response.warnings);
      setShowPublishConfirm(false);
      await loadDailyMenuDetails(dailyMenu.id);
    } catch (err: any) {
      setError(err.message || 'Failed to publish daily menu');
      setShowPublishConfirm(false);
    }
  };

  // Lock handler
  const handleLock = async () => {
    if (!dailyMenu) return;

    try {
      setError('');
      await apiClient.lockDailyMenu(dailyMenu.id);
      await loadDailyMenuDetails(dailyMenu.id);
    } catch (err: any) {
      setError(err.message || 'Failed to lock daily menu');
    }
  };

  // Unlock handler
  const handleUnlock = async () => {
    if (!dailyMenu) return;

    try {
      setError('');
      await apiClient.unlockDailyMenu(dailyMenu.id);
      await loadDailyMenuDetails(dailyMenu.id);
    } catch (err: any) {
      setError(err.message || 'Failed to unlock daily menu');
    }
  };

  // Unpublish handler (reset to draft)
  const handleUnpublish = async () => {
    if (!dailyMenu) return;

    try {
      setError('');
      await apiClient.unpublishDailyMenu(dailyMenu.id);
      setShowUnpublishConfirm(false);
      await loadDailyMenuDetails(dailyMenu.id);
    } catch (err: any) {
      setError(err.message || 'Failed to unpublish daily menu');
      setShowUnpublishConfirm(false);
    }
  };

  // Delete handler (draft only)
  const handleDelete = async () => {
    if (!dailyMenu) return;

    try {
      setError('');
      await apiClient.deleteDailyMenu(dailyMenu.id);
      setShowDeleteConfirm(false);
      setSelectedMenuId(null);
      await loadDailyMenus(state.selectedDate);
    } catch (err: any) {
      setError(err.message || 'Failed to delete daily menu');
      setShowDeleteConfirm(false);
    }
  };

  // Delete menu and all its orders (dev only)
  const handleDeleteWithOrders = async () => {
    if (!dailyMenu) return;

    try {
      setError('');
      await apiClient.deleteDailyMenu(dailyMenu.id, true);
      setShowDeleteWithOrdersConfirm(false);
      setSelectedMenuId(null);
      await loadDailyMenus(state.selectedDate);
    } catch (err: any) {
      setError(err.message || 'Failed to delete daily menu and orders');
      setShowDeleteWithOrdersConfirm(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <StickyHeader
        selectedDate={state.selectedDate}
        onDateChange={setSelectedDate}
        status={dailyMenu?.status}
        menus={dailyMenus}
      >
        {/* Inline Toolbar */}
        {dailyMenu && (
          <QuickActionsBar
            dailyMenu={dailyMenu}
            allServices={allServices}
            isReadOnly={isReadOnly}
            onPublish={() => setShowPublishConfirm(true)}
            onLock={handleLock}
            onUnlock={handleUnlock}
            onUnpublish={() => setShowUnpublishConfirm(true)}
            onDelete={() => setShowDeleteConfirm(true)}
            onDeleteWithOrders={() => setShowDeleteWithOrdersConfirm(true)}
            showPublishConfirm={showPublishConfirm}
            showUnpublishConfirm={showUnpublishConfirm}
            showDeleteConfirm={showDeleteConfirm}
            showDeleteWithOrdersConfirm={showDeleteWithOrdersConfirm}
            onPublishConfirm={handlePublish}
            onPublishCancel={() => setShowPublishConfirm(false)}
            onUnpublishConfirm={handleUnpublish}
            onUnpublishCancel={() => setShowUnpublishConfirm(false)}
            onDeleteConfirm={handleDelete}
            onDeleteCancel={() => setShowDeleteConfirm(false)}
            onDeleteWithOrdersConfirm={handleDeleteWithOrders}
            onDeleteWithOrdersCancel={() => setShowDeleteWithOrdersConfirm(false)}
          />
        )}
      </StickyHeader>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Calendar View - Always Visible */}
        <div className="mb-6">
          <MenuCalendar
            menus={dailyMenus}
            selectedDate={state.selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
            }}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4">
            <Error message={error} onRetry={() => setError('')} />
          </div>
        )}

        {/* Publish Warnings */}
        {publishWarnings.length > 0 && (
          <div className="mb-4 p-4 bg-warning-50 border border-warning-300 text-warning-800 rounded-lg">
            <h3 className="font-semibold mb-2 text-sm">Warnings:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {publishWarnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <SplitPane
          left={
            <>
              {/* Create Menu Button (if no menu exists) */}
              {!dailyMenu && !loading && (
                <div className="bg-surface border border-surface-dark rounded-lg p-6 mb-6">
                  <Empty
                    message="No menu for this date"
                    description={
                      state.selectedDate < today
                        ? 'This date is in the past. No menu exists for this date.'
                        : state.selectedDate === today
                        ? "Today's menu hasn't been created yet. Create one to get started."
                        : "Tomorrow's menu hasn't been created yet. Create one to get started."
                    }
                  />
                  {state.selectedDate >= today && (
                    <div className="mt-4">
                      <button
                        onClick={handleCreateDailyMenu}
                        className="w-full px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                      >
                        Create Menu
                      </button>
                      <p className="mt-2 text-sm text-gray-500 text-center">
                        Note: Cutoff times are configured per service in the Services page.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="bg-surface border border-surface-dark rounded-lg p-12">
                  <Loading message="Loading menu..." />
                </div>
              )}

              {/* Daily Menu View */}
              {dailyMenu && !loading && (
                <DailyMenuView
                  dailyMenu={dailyMenu}
                  allServices={allServices}
                  serviceDetails={serviceDetails}
                  foodComponentVariants={foodComponentVariants}
                  variantStocks={variantStocks}
                  updatingVariants={updatingVariants}
                  expandedServices={state.expandedServices}
                  expandedSections={expandedSections}
                  isReadOnly={isReadOnly}
                  onServiceToggle={handleServiceToggle}
                  onToggleServiceVariants={toggleServiceExpanded}
                  onVariantToggle={handleServiceVariantToggle}
                  onStockChange={handleServiceVariantStockChange}
                  onToggleSection={toggleSection}
                />
              )}
            </>
          }
          right={
            <>
              {/* Side Panel Toggle Button (Mobile) */}
              {!state.sidePanelOpen && (
                <button
                  onClick={() => toggleSidePanel('services')}
                  className="lg:hidden fixed bottom-4 right-4 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors z-40"
                  aria-label="Toggle side panel"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}

              {/* Side Panel */}
              {(state.sidePanelOpen || true) && (
                <SidePanel
                  isOpen={state.sidePanelOpen || true}
                  section={state.sidePanelSection}
                  allServices={allServices}
                  onClose={() => toggleSidePanel(null)}
                  onSectionChange={(section) => toggleSidePanel(section)}
                />
              )}
            </>
          }
        />
      </div>
    </div>
  );
}
