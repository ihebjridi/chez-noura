'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '../../lib/api-client';
import { VariantDto, ComponentDto, UpdateVariantDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { OrderStatisticsCard } from '../../components/statistics/OrderStatisticsCard';
import { useVariantStatistics } from '../../hooks/useVariantStatistics';
import { StatisticsBadge } from '../../components/statistics/StatisticsBadge';
import { StatusBadge } from '../../components/ui/status-badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function VariantsPage() {
  const searchParams = useSearchParams();
  const componentIdFilter = searchParams.get('componentId');

  const [variants, setVariants] = useState<VariantDto[]>([]);
  const [components, setComponents] = useState<ComponentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);
  const [updatingStock, setUpdatingStock] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [componentsData, allVariants] = await Promise.all([
        apiClient.getComponents(),
        loadAllVariants(),
      ]);
      setComponents(componentsData);
      setVariants(allVariants);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAllVariants = async (): Promise<VariantDto[]> => {
    const allVariants: VariantDto[] = [];
    const components = await apiClient.getComponents();
    for (const component of components) {
      try {
        const variants = await apiClient.getComponentVariants(component.id);
        allVariants.push(...variants);
      } catch (err) {
        // Ignore errors for individual components
      }
    }
    return allVariants;
  };

  const quickUpdateStock = async (variantId: string, newStock: number) => {
    try {
      setUpdatingStock((prev) => new Set(prev).add(variantId));
      setError('');
      await apiClient.updateVariant(variantId, { stockQuantity: newStock });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update stock');
    } finally {
      setUpdatingStock((prev) => {
        const next = new Set(prev);
        next.delete(variantId);
        return next;
      });
    }
  };

  // Group variants by component
  const variantsByComponent = useMemo(() => {
    const grouped = new Map<string, { component: ComponentDto; variants: VariantDto[] }>();
    for (const component of components) {
      const componentVariants = variants.filter((v) => v.componentId === component.id);
      if (componentVariants.length > 0) {
        grouped.set(component.id, { component, variants: componentVariants });
      }
    }
    return grouped;
  }, [variants, components]);

  // Filter by componentId if provided
  const filteredVariantsByComponent = useMemo(() => {
    if (!componentIdFilter) return variantsByComponent;
    const filtered = new Map<string, { component: ComponentDto; variants: VariantDto[] }>();
    const entry = variantsByComponent.get(componentIdFilter);
    if (entry) {
      filtered.set(componentIdFilter, entry);
    }
    return filtered;
  }, [variantsByComponent, componentIdFilter]);

  const { statistics, loading: statsLoading } = useVariantStatistics(expandedVariantId);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading variants..." />
        </div>
      </div>
    );
  }

  if (error && !variants.length) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Error message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {componentIdFilter && (
        <div className="mb-4">
          <Link
            href="/variants"
            className="text-primary-600 hover:text-primary-700 mb-2 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            All Variants
          </Link>
        </div>
      )}

      <PageHeader
        title={componentIdFilter ? `Variants: ${components.find((c) => c.id === componentIdFilter)?.name || ''}` : 'Variants'}
        description="Manage all variants across all components"
      />

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      {filteredVariantsByComponent.size === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No variants found"
            description={componentIdFilter ? 'This component has no variants yet.' : 'Create components and variants to get started.'}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(filteredVariantsByComponent.values()).map(({ component, variants: componentVariants }) => (
            <div key={component.id} className="bg-surface border border-surface-dark rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-surface-light border-b border-surface-dark">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{component.name}</h2>
                  <Link href={`/components?highlight=${component.id}`}>
                    <Button variant="secondary" size="sm">
                      View Component
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {componentVariants.map((variant) => {
                    const isExpanded = expandedVariantId === variant.id;
                    const isOutOfStock = variant.stockQuantity <= 0;
                    const isLowStock = variant.stockQuantity > 0 && variant.stockQuantity < 10;
                    const isUpdating = updatingStock.has(variant.id);

                    return (
                      <div
                        key={variant.id}
                        className={`border rounded-lg p-4 ${
                          isOutOfStock
                            ? 'bg-error-50 border-error-200'
                            : isLowStock
                              ? 'bg-warning-50 border-warning-200'
                              : 'bg-white border-surface-dark'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{variant.name}</h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {!variant.isActive && <StatusBadge status="INACTIVE" />}
                              {variant.isActive && isOutOfStock && <StatusBadge status="OUT_OF_STOCK" />}
                              {variant.isActive && !isOutOfStock && isLowStock && (
                                <StatusBadge status="LOW_STOCK" />
                              )}
                            </div>
                          </div>
                          {variant.imageUrl && (
                            <img
                              src={`${API_BASE_URL}${variant.imageUrl}`}
                              alt={variant.name}
                              className="w-16 h-16 object-cover rounded-md border border-surface-dark"
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <StatisticsBadge
                            label="Stock"
                            value={variant.stockQuantity}
                            variant={
                              isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'
                            }
                            size="sm"
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => quickUpdateStock(variant.id, variant.stockQuantity - 1)}
                              disabled={variant.stockQuantity <= 0 || isUpdating}
                            >
                              -1
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => quickUpdateStock(variant.id, variant.stockQuantity + 1)}
                              disabled={isUpdating}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => quickUpdateStock(variant.id, variant.stockQuantity + 10)}
                              disabled={isUpdating}
                            >
                              +10
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setExpandedVariantId(isExpanded ? null : variant.id)}
                            className="flex-1"
                          >
                            {isExpanded ? 'Hide Stats' : 'Show Stats'}
                          </Button>
                          <Link href={`/components/${component.id}/variants`}>
                            <Button variant="primary" size="sm">
                              Edit
                            </Button>
                          </Link>
                        </div>

                        {isExpanded && statistics && statistics.variantId === variant.id && (
                          <div className="mt-4 pt-4 border-t border-surface-dark">
                            {statsLoading ? (
                              <Loading message="Loading statistics..." />
                            ) : (
                              <OrderStatisticsCard statistics={statistics} type="variant" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
