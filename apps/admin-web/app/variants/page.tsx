'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../lib/api-client';
import { VariantDto, ComponentDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { StatisticsBadge } from '../../components/statistics/StatisticsBadge';
import { StatusBadge } from '../../components/ui/status-badge';
import { VariantModal } from '../../components/variants/VariantModal';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../../components/ui/dialog';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { getImageSrc } from '../../lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function VariantsPage() {
  const searchParams = useSearchParams();
  const componentIdFilter = searchParams.get('componentId');

  const [variants, setVariants] = useState<VariantDto[]>([]);
  const [components, setComponents] = useState<ComponentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVariantId, setModalVariantId] = useState<string | null | 'create'>(
    null,
  );
  const [modalInitialVariant, setModalInitialVariant] =
    useState<VariantDto | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
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
    const comps = await apiClient.getComponents();
    for (const comp of comps) {
      try {
        const vs = await apiClient.getComponentVariants(comp.id);
        allVariants.push(...vs);
      } catch {
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

  const openViewEdit = (variant: VariantDto) => {
    setModalInitialVariant(variant);
    setModalVariantId(variant.id);
  };

  const openCreate = () => {
    setModalInitialVariant(null);
    setModalVariantId('create');
  };

  const closeModal = () => {
    setModalVariantId(null);
    setModalInitialVariant(null);
  };

  const handleDeleteClick = (variantId: string) => {
    setDeletingVariantId(variantId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVariantId) return;
    try {
      setDeleting(true);
      setError('');
      await apiClient.deleteVariant(deletingVariantId);
      setShowDeleteModal(false);
      setDeletingVariantId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete variant');
    } finally {
      setDeleting(false);
    }
  };

  const displayVariants = useMemo(() => {
    if (!componentIdFilter) return variants;
    return variants.filter((v) => v.componentId === componentIdFilter);
  }, [variants, componentIdFilter]);

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {componentIdFilter && (
        <div>
          <Link
            href="/variants"
            className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            All Variants
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title={
            componentIdFilter
              ? `Variants: ${components.find((c) => c.id === componentIdFilter)?.name || ''}`
              : 'Variants'
          }
          description="Manage variants across all components. Click a row to edit."
        />
        {components.length > 0 && (
          <Button onClick={openCreate} className="flex items-center gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            New Variant
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      {displayVariants.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No variants found"
            description={
              componentIdFilter
                ? 'This component has no variants yet.'
                : 'Create components and variants to get started.'
            }
          />
        </div>
      ) : (
        <div className="bg-surface border border-surface-dark rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-light border-b border-surface-dark text-sm font-semibold text-gray-700">
            <div className="col-span-2">Component</div>
            <div className="col-span-2">Variant</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Stock</div>
            <div className="col-span-2">Adjust</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>

          {displayVariants.map((variant) => {
            const isOutOfStock = variant.stockQuantity <= 0;
            const isLowStock =
              variant.stockQuantity > 0 && variant.stockQuantity < 10;
            const isUpdating = updatingStock.has(variant.id);

            return (
              <div
                key={variant.id}
                onClick={() => openViewEdit(variant)}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-surface-dark last:border-b-0 cursor-pointer hover:bg-surface-light transition-colors ${
                  isOutOfStock ? 'bg-error-50/30' : isLowStock ? 'bg-warning-50/30' : ''
                }`}
              >
                <div className="col-span-2 text-sm text-gray-700">
                  {variant.componentName}
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  {variant.imageUrl ? (
                    <img
                      src={getImageSrc(variant.imageUrl, API_BASE_URL)}
                      alt={variant.name}
                      className="w-10 h-10 object-cover rounded border border-surface-dark flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-surface-light border border-surface-dark rounded flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                      No img
                    </div>
                  )}
                  <span className="font-medium text-gray-900 truncate">
                    {variant.name}
                  </span>
                </div>
                <div className="col-span-1">
                  <div className="flex flex-wrap gap-1">
                    {!variant.isActive && (
                      <StatusBadge status="INACTIVE" />
                    )}
                    {variant.isActive && isOutOfStock && (
                      <StatusBadge status="OUT_OF_STOCK" />
                    )}
                    {variant.isActive && !isOutOfStock && isLowStock && (
                      <StatusBadge status="LOW_STOCK" />
                    )}
                    {variant.isActive &&
                      !isOutOfStock &&
                      !isLowStock && (
                        <StatusBadge status="AVAILABLE" />
                      )}
                  </div>
                </div>
                <div className="col-span-1">
                  <StatisticsBadge
                    label=""
                    value={variant.stockQuantity}
                    variant={
                      isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'
                    }
                    size="sm"
                  />
                </div>
                <div
                  className="col-span-2 flex gap-1 flex-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      quickUpdateStock(variant.id, variant.stockQuantity - 1)
                    }
                    disabled={
                      variant.stockQuantity <= 0 || isUpdating
                    }
                  >
                    -1
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      quickUpdateStock(variant.id, variant.stockQuantity + 1)
                    }
                    disabled={isUpdating}
                  >
                    +1
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      quickUpdateStock(variant.id, variant.stockQuantity + 10)
                    }
                    disabled={isUpdating}
                  >
                    +10
                  </Button>
                </div>
                <div
                  className="col-span-4 flex justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(variant.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <VariantModal
        open={modalVariantId !== null}
        onClose={closeModal}
        variantId={modalVariantId === 'create' ? null : modalVariantId}
        componentId={
          componentIdFilter || (components[0]?.id ?? undefined)
        }
        initialVariant={modalInitialVariant}
        onSaved={loadData}
      />

      <Dialog
        open={showDeleteModal}
        onOpenChange={(o) => !o && setShowDeleteModal(false)}
      >
        <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Variant?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this variant? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {deletingVariantId && (
              <p className="text-sm text-gray-600">
                Variant{' '}
                <strong>
                  &quot;
                  {variants.find((v) => v.id === deletingVariantId)?.name}
                  &quot;
                </strong>{' '}
                will be permanently deleted.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={deleting || !deletingVariantId}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
