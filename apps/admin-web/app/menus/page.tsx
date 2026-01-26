'use client';

import { useState } from 'react';
import { QuickActionsBar } from '../components/QuickActionsBar';
import { DailyMenuView } from '../components/DailyMenuView';
import { MenuCalendar } from '../components/MenuCalendar';
import { SidePanel } from '../components/SidePanel';
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
    allPacks,
    packDetails,
    foodComponentVariants,
    variantStocks,
    updatingVariants,
    loading,
    error,
    publishWarnings,
    setSelectedDate,
    setSelectedMenuId,
    toggleSidePanel,
    togglePackExpanded,
    setError,
    setPublishWarnings,
    setUpdatingVariants,
    setVariantStocks,
    setDailyMenu,
    setPackDetails,
    setFoodComponentVariants,
    loadDailyMenus,
    loadDailyMenuDetails,
  } = useDailyMenuState();

  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['packs']));
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
      const newMenu = await apiClient.createDailyMenu({ date: state.selectedDate });
      setSelectedMenuId(newMenu.id);
      // Reload menus for the current selected date to include the newly created menu
      await loadDailyMenus(state.selectedDate);
    } catch (err: any) {
      setError(err.message || 'Failed to create daily menu');
    }
  };

  // Pack toggle handler
  const handlePackToggle = async (packId: string, checked: boolean) => {
    if (!dailyMenu || isReadOnly) return;

    if (checked && !dailyMenu.packs.some((p) => p.packId === packId)) {
      const pack = allPacks.find((p) => p.id === packId);
      if (pack) {
        setDailyMenu((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            packs: [
              ...prev.packs,
              {
                id: `temp-${packId}`,
                dailyMenuId: prev.id,
                packId: pack.id,
                packName: pack.name,
                packPrice: pack.price,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        });

        try {
          setError('');
          const result = await apiClient.addPackToDailyMenu(dailyMenu.id, { packId });

          setDailyMenu((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              packs: prev.packs.map((p) =>
                p.packId === packId && p.id.startsWith('temp-')
                  ? {
                      id: result.id,
                      dailyMenuId: result.dailyMenuId,
                      packId: result.packId,
                      packName: pack?.name || result.packName,
                      packPrice: pack?.price || result.packPrice,
                      createdAt: result.createdAt,
                      updatedAt: result.updatedAt,
                    }
                  : p
              ),
            };
          });

          if (!packDetails.has(packId)) {
            try {
              const packDetail = await apiClient.getPackById(packId);
              setPackDetails((prev) => {
                const newMap = new Map(prev);
                newMap.set(packId, packDetail);
                return newMap;
              });

              const foodComponentIds = new Set<string>();
              packDetail.components.forEach((foodComp) => foodComponentIds.add(foodComp.componentId));

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
              console.error(`Failed to load pack details:`, err);
            }
          }
        } catch (err: any) {
          setError(err.message || 'Failed to add pack');
          setDailyMenu((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              packs: prev.packs.filter((p) => !(p.packId === packId && p.id.startsWith('temp-'))),
            };
          });
        }
      }
    } else if (!checked && dailyMenu.packs.some((p) => p.packId === packId)) {
      setError('Pack cannot be removed once added. This is a backend limitation.');
    }
  };

  // Variant toggle handler
  const handleVariantToggle = async (variantId: string, checked: boolean, foodComponentId: string) => {
    if (!dailyMenu || isReadOnly) return;

    if (checked && !dailyMenu.variants.some((v) => v.variantId === variantId)) {
      const stock = variantStocks.get(variantId) || 50;
      if (stock <= 0) {
        setError('Please enter a stock quantity (greater than 0) before adding the variant');
        return;
      }

      const variants = foodComponentVariants.get(foodComponentId) || [];
      const variant = variants.find((v) => v.id === variantId);

      let foodComponentName = '';
      for (const [, packDetail] of packDetails.entries()) {
        const foundFoodComponent = packDetail.components.find((c) => c.componentId === foodComponentId);
        if (foundFoodComponent) {
          foodComponentName = foundFoodComponent.componentName;
          break;
        }
      }

      setUpdatingVariants((prev) => new Set(prev).add(variantId));
      setDailyMenu((prev) => {
        if (!prev || !variant) return prev;
        return {
          ...prev,
          variants: [
            ...prev.variants,
            {
              id: `temp-${variantId}`,
              dailyMenuId: prev.id,
              variantId: variant.id,
              variantName: variant.name,
              componentId: foodComponentId,
              componentName: foodComponentName,
              initialStock: stock,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        };
      });

      try {
        setError('');
        const result = await apiClient.addVariantToDailyMenu(dailyMenu.id, {
          variantId,
          initialStock: stock,
        });

        setDailyMenu((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            variants: prev.variants.map((v) =>
              v.variantId === variantId && v.id.startsWith('temp-') ? result : v
            ),
          };
        });
      } catch (err: any) {
        setError(err.message || 'Failed to add variant');
        setDailyMenu((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            variants: prev.variants.filter((v) => !(v.variantId === variantId && v.id.startsWith('temp-'))),
          };
        });
      } finally {
        setUpdatingVariants((prev) => {
          const newSet = new Set(prev);
          newSet.delete(variantId);
          return newSet;
        });
      }
    } else if (!checked && dailyMenu.variants.some((v) => v.variantId === variantId)) {
      // Only allow removal from DRAFT menus
      if (dailyMenu.status !== DailyMenuStatus.DRAFT) {
        setError('Variant cannot be removed once the menu is published. This is a backend limitation.');
        return;
      }

      // Remove variant from DRAFT menu
      setUpdatingVariants((prev) => new Set(prev).add(variantId));
      setDailyMenu((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          variants: prev.variants.filter((v) => v.variantId !== variantId),
        };
      });

      try {
        setError('');
        await apiClient.removeVariantFromDailyMenu(dailyMenu.id, variantId);
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

  // Stock change handler
  const handleStockChange = (variantId: string, stock: number, isExisting: boolean) => {
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
          variants: prev.variants.map((v) =>
            v.variantId === variantId ? { ...v, initialStock: stock } : v
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

  // Delete handler
  const handleDelete = async () => {
    if (!dailyMenu) return;

    try {
      setError('');
      await apiClient.deleteDailyMenu(dailyMenu.id);
      setShowDeleteConfirm(false);
      setSelectedMenuId(null);
      // Reload menus for the current selected date (menu will be gone, so it will show "no menu")
      await loadDailyMenus(state.selectedDate);
    } catch (err: any) {
      setError(err.message || 'Failed to delete daily menu');
      setShowDeleteConfirm(false);
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
            isReadOnly={isReadOnly}
            onPublish={() => setShowPublishConfirm(true)}
            onLock={handleLock}
            onDelete={() => setShowDeleteConfirm(true)}
            showPublishConfirm={showPublishConfirm}
            showDeleteConfirm={showDeleteConfirm}
            onPublishConfirm={handlePublish}
            onPublishCancel={() => setShowPublishConfirm(false)}
            onDeleteConfirm={handleDelete}
            onDeleteCancel={() => setShowDeleteConfirm(false)}
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
                    <button
                      onClick={handleCreateDailyMenu}
                      className="mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                      Create Menu
                    </button>
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
                  allPacks={allPacks}
                  packDetails={packDetails}
                  foodComponentVariants={foodComponentVariants}
                  variantStocks={variantStocks}
                  updatingVariants={updatingVariants}
                  expandedPacks={state.expandedPacks}
                  expandedSections={expandedSections}
                  isReadOnly={isReadOnly}
                  onPackToggle={handlePackToggle}
                  onTogglePackVariants={togglePackExpanded}
                  onVariantToggle={handleVariantToggle}
                  onStockChange={handleStockChange}
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
                  onClick={() => toggleSidePanel('packs')}
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
                  allPacks={allPacks}
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
