'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '../../../components/protected-route';
import { useAuth } from '../../../contexts/auth-context';
import { apiClient } from '../../../lib/api-client';
import {
  DailyMenuWithDetailsDto,
  DailyMenuStatus,
  PackDto,
  PackWithComponentsDto,
  VariantDto,
  UserRole,
  PublishDailyMenuResponseDto,
} from '@contracts/core';
import Link from 'next/link';
import { DailyMenuHeader } from './components/DailyMenuHeader';
import { PackSelection } from './components/PackSelection';
import { PublishConfirmModal } from './components/PublishConfirmModal';
import { LockedStateSummary } from './components/LockedStateSummary';

export default function DailyMenuEditorPage() {
  const { logout } = useAuth();
  const params = useParams();
  const dailyMenuId = params.id as string;

  const [dailyMenu, setDailyMenu] = useState<DailyMenuWithDetailsDto | null>(null);
  const [allPacks, setAllPacks] = useState<PackDto[]>([]);
  const [packDetails, setPackDetails] = useState<Map<string, PackWithComponentsDto>>(new Map());
  const [foodComponentVariants, setFoodComponentVariants] = useState<Map<string, VariantDto[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishWarnings, setPublishWarnings] = useState<string[]>([]);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [variantStocks, setVariantStocks] = useState<Map<string, number>>(new Map());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['packs']));
  const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set());
  const [updatingVariants, setUpdatingVariants] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (dailyMenuId) {
      loadData();
    }
  }, [dailyMenuId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [menuData, packsData] = await Promise.all([
        apiClient.getDailyMenuById(dailyMenuId),
        apiClient.getPacks(),
      ]);

      setDailyMenu(menuData);
      setAllPacks(packsData);

      const packDetailsMap = new Map<string, PackWithComponentsDto>();
      const foodComponentIds = new Set<string>();

      for (const pack of packsData) {
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
  };

  const isPackSelected = (packId: string) => {
    return dailyMenu?.packs.some((p) => p.packId === packId) || false;
  };

  const isVariantSelected = (variantId: string) => {
    return dailyMenu?.variants.some((v) => v.variantId === variantId) || false;
  };

  const getVariantStock = (variantId: string) => {
    const existingVariant = dailyMenu?.variants.find((v) => v.variantId === variantId);
    if (existingVariant) {
      return existingVariant.initialStock;
    }
    return variantStocks.get(variantId) || 0;
  };

  const handlePackToggle = async (packId: string, checked: boolean) => {
    if (!dailyMenu) return;

    if (checked && !isPackSelected(packId)) {
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
      }

      try {
        setError('');
        const result = await apiClient.addPackToDailyMenu(dailyMenuId, { packId });

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
    } else if (!checked && isPackSelected(packId)) {
      setError('Pack cannot be removed once added. This is a backend limitation.');
    }
  };

  const handleVariantToggle = async (variantId: string, checked: boolean, foodComponentId: string) => {
    if (!dailyMenu) return;

    if (checked && !isVariantSelected(variantId)) {
      const stock = getVariantStock(variantId) || 0;
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
        const result = await apiClient.addVariantToDailyMenu(dailyMenuId, {
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
    } else if (!checked && isVariantSelected(variantId)) {
      setError('Variant cannot be removed once added. This is a backend limitation.');
    }
  };

  const handleStockChange = (variantId: string, stock: number, isExisting: boolean) => {
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

  const handlePublish = async () => {
    if (!dailyMenu) return;

    try {
      setError('');
      const response: PublishDailyMenuResponseDto = await apiClient.publishDailyMenu(dailyMenuId);
      setPublishWarnings(response.warnings);
      setShowPublishConfirm(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to publish daily menu');
      setShowPublishConfirm(false);
    }
  };

  const handleLock = async () => {
    if (!dailyMenu) return;

    try {
      setError('');
      await apiClient.lockDailyMenu(dailyMenuId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to lock daily menu');
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

  const togglePackVariants = (packId: string) => {
    setExpandedPacks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(packId)) {
        newSet.delete(packId);
      } else {
        newSet.add(packId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading daily menu...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!dailyMenu) {
    return (
      <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-red-600">Daily menu not found</p>
            <Link href="/daily-menus" className="text-blue-600 hover:underline mt-4 inline-block">
              ← Back to Daily Menus
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const isLocked = dailyMenu.status === DailyMenuStatus.LOCKED;
  const isDraft = dailyMenu.status === DailyMenuStatus.DRAFT;
  const isPublished = dailyMenu.status === DailyMenuStatus.PUBLISHED;
  const canLock = isPublished && new Date() >= new Date(dailyMenu.date + 'T14:00:00');

  const selectedPackIds = new Set(dailyMenu.packs.map((p) => p.packId));
  const selectedVariants = new Set(dailyMenu.variants.map((v) => v.variantId));
  const existingVariantStocks = new Map(
    dailyMenu.variants.map((v) => [v.variantId, v.initialStock])
  );

  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div className="p-8 max-w-7xl mx-auto">
        <DailyMenuHeader
          dailyMenu={dailyMenu}
          isDraft={isDraft}
          canLock={canLock}
          onPublishClick={() => setShowPublishConfirm(true)}
          onLockClick={handleLock}
          onLogout={logout}
        />

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
        )}

        {publishWarnings.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
            <h3 className="font-semibold mb-2">Publish Warnings:</h3>
            <ul className="list-disc list-inside space-y-1">
              {publishWarnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <PackSelection
          packs={allPacks}
          selectedPackIds={selectedPackIds}
          expandedPacks={expandedPacks}
          packDetails={packDetails}
          foodComponentVariants={foodComponentVariants}
          selectedVariants={selectedVariants}
          variantStocks={variantStocks}
          existingVariantStocks={existingVariantStocks}
          updatingVariants={updatingVariants}
          isLocked={isLocked}
          isExpanded={expandedSections.has('packs')}
          onToggleSection={() => toggleSection('packs')}
          onPackToggle={handlePackToggle}
          onTogglePackVariants={togglePackVariants}
          onVariantToggle={handleVariantToggle}
          onStockChange={handleStockChange}
        />

        {isLocked && <LockedStateSummary dailyMenu={dailyMenu} />}

        <PublishConfirmModal
          isOpen={showPublishConfirm}
          onConfirm={handlePublish}
          onCancel={() => setShowPublishConfirm(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
