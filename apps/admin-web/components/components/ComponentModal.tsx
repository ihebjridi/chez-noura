'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import {
  ComponentDto,
  VariantDto,
  CreateComponentDto,
  ComponentPackUsageDto,
} from '@contracts/core';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../ui/dialog';
import { FormField } from '../ui/form-field';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Loading } from '../ui/loading';
import { StatusBadge } from '../ui/status-badge';
import { VariantModal } from '../variants/VariantModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Trash2, Plus, Package, Link2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ComponentModalProps {
  open: boolean;
  onClose: () => void;
  componentId: string | null;
  onSaved?: () => void;
}

export function ComponentModal({
  open,
  onClose,
  componentId,
  onSaved,
}: ComponentModalProps) {
  const isCreate = componentId === null;

  const [component, setComponent] = useState<ComponentDto | null>(null);
  const [componentName, setComponentName] = useState('');
  const [variants, setVariants] = useState<VariantDto[]>([]);
  const [componentPacks, setComponentPacks] = useState<ComponentPackUsageDto[]>(
    [],
  );
  const [allVariantsForAssign, setAllVariantsForAssign] = useState<VariantDto[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [removingVariantId, setRemovingVariantId] = useState<string | null>(
    null,
  );
  const [assigningVariantId, setAssigningVariantId] = useState<string | null>(
    null,
  );
  const [showAssignVariant, setShowAssignVariant] = useState(false);
  const [selectedVariantIdToAssign, setSelectedVariantIdToAssign] =
    useState('');

  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantModalVariantId, setVariantModalVariantId] = useState<
    string | null
  >(null);
  const [variantModalInitial, setVariantModalInitial] =
    useState<VariantDto | null>(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (isCreate) {
      setComponent(null);
      setComponentName('');
      setVariants([]);
      setComponentPacks([]);
    }
  }, [open, componentId, isCreate]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const comps = await apiClient.getComponents();
        if (cancelled) return;

        if (isCreate) {
          setComponent(null);
          setVariants([]);
          setComponentPacks([]);
          setLoading(false);
          return;
        }

        if (componentId) {
          const [variantsData, packsData] = await Promise.all([
            apiClient.getComponentVariants(componentId),
            apiClient.getComponentPacks(componentId),
          ]);
          if (cancelled) return;
          const comp = comps.find((c) => c.id === componentId);
          setComponent(comp ?? null);
          setComponentName(comp?.name ?? '');
          setVariants(variantsData);
          setComponentPacks(packsData);

          const allV: VariantDto[] = [];
          for (const c of comps) {
            const vs = await apiClient.getComponentVariants(c.id);
            allV.push(...vs);
          }
          if (!cancelled) {
            setAllVariantsForAssign(
              allV.filter((v) => v.componentId !== componentId),
            );
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, componentId, isCreate]);

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isCreate) {
      if (!componentName.trim()) {
        setError('Name is required');
        return;
      }
      try {
        setSaving(true);
        await apiClient.createComponent({ name: componentName.trim() });
        onSaved?.();
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to create component');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteComponent = async () => {
    if (!componentId) return;
    try {
      setDeleting(true);
      setError('');
      await apiClient.deleteComponent(componentId);
      setShowDeleteConfirm(false);
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete component');
    } finally {
      setDeleting(false);
    }
  };

  const openVariantModal = (variantId: string | null, initial?: VariantDto) => {
    setVariantModalVariantId(variantId);
    setVariantModalInitial(initial ?? null);
    setVariantModalOpen(true);
  };

  const closeVariantModal = () => {
    setVariantModalOpen(false);
    setVariantModalVariantId(null);
    setVariantModalInitial(null);
  };

  const handleVariantSaved = async () => {
    if (!componentId) return;
    const vs = await apiClient.getComponentVariants(componentId);
    setVariants(vs);
    const comps = await apiClient.getComponents();
    const allV: VariantDto[] = [];
    for (const c of comps) {
      const vlist = await apiClient.getComponentVariants(c.id);
      allV.push(...vlist);
    }
    setAllVariantsForAssign(allV.filter((v) => v.componentId !== componentId));
    onSaved?.();
  };

  const handleAssignExistingVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentId || !selectedVariantIdToAssign) return;
    try {
      setAssigningVariantId(selectedVariantIdToAssign);
      setError('');
      await apiClient.updateVariant(selectedVariantIdToAssign, {
        componentId,
      });
      setShowAssignVariant(false);
      setSelectedVariantIdToAssign('');
      await handleVariantSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to assign variant');
    } finally {
      setAssigningVariantId(null);
    }
  };

  const deleteVariantFromComponent = async (variantId: string) => {
    if (!componentId) return;
    try {
      setRemovingVariantId(variantId);
      setError('');
      await apiClient.deleteVariant(variantId);
      await handleVariantSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to delete variant');
    } finally {
      setRemovingVariantId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreate
                ? 'New Component'
                : component
                  ? component.name
                  : 'Component'}
            </DialogTitle>
            <DialogDescription>
              {isCreate
                ? 'Create a food component. You can add variants after saving.'
                : 'View or edit this component and its variants.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg bg-error-50 border border-error-200 px-3 py-2 text-sm text-error-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-8">
              <Loading message="Loading..." />
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Component
                </h3>
                {isCreate ? (
                  <form
                    onSubmit={handleSaveComponent}
                    className="space-y-4"
                  >
                    <FormField label="Name" required>
                      <Input
                        type="text"
                        value={componentName}
                        onChange={(e) =>
                          setComponentName(e.target.value)
                        }
                        required
                        placeholder="e.g., Soup, Main Dish, Salad"
                      />
                    </FormField>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={saving}
                      >
                        {saving ? 'Creating...' : 'Create Component'}
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!componentId || !componentName.trim()) {
                        setError('Name is required');
                        return;
                      }
                      try {
                        setSaving(true);
                        setError('');
                        await apiClient.updateComponent(componentId, {
                          name: componentName.trim(),
                        });
                        setComponent((prev) =>
                          prev ? { ...prev, name: componentName.trim() } : null,
                        );
                        onSaved?.();
                      } catch (err: any) {
                        setError(err.message || 'Failed to update component');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <FormField label="Name" required>
                      <Input
                        type="text"
                        value={componentName}
                        onChange={(e) =>
                          setComponentName(e.target.value)
                        }
                        required
                        placeholder="e.g., Soup, Main Dish, Salad"
                      />
                    </FormField>
                    <div className="flex items-center gap-4">
                      <div className="flex-1" />
                      {componentId && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center gap-1"
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      )}
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </form>
                )}
              </section>

              {!isCreate && componentId && (
                <>
                  {componentPacks.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Used in packs
                      </h3>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {componentPacks.map((cp) => (
                          <li key={cp.packId}>
                            {cp.packName} (required:{' '}
                            {cp.required ? 'yes' : 'no'}, order: {cp.orderIndex})
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Variants
                    </h3>
                    <div className="flex gap-2 mb-3">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          openVariantModal(null)
                        }
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        New variant
                      </Button>
                      {allVariantsForAssign.length > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setShowAssignVariant(true)}
                          className="flex items-center gap-1"
                        >
                          <Link2 className="h-4 w-4" />
                          Assign existing variant
                        </Button>
                      )}
                    </div>

                    {showAssignVariant && (
                      <form
                        onSubmit={handleAssignExistingVariant}
                        className="mb-4 p-4 bg-surface-light border border-surface-dark rounded-lg space-y-3"
                      >
                        <FormField label="Select variant to assign to this component">
                          <select
                            value={selectedVariantIdToAssign}
                            onChange={(e) =>
                              setSelectedVariantIdToAssign(e.target.value)
                            }
                            className="w-full px-3 py-2 border border-surface-dark rounded-md bg-surface text-gray-900"
                          >
                            <option value="">
                              Choose a variant from another component
                            </option>
                            {allVariantsForAssign.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.componentName})
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={
                              !selectedVariantIdToAssign ||
                              assigningVariantId !== null
                            }
                          >
                            {assigningVariantId
                              ? 'Assigning...'
                              : 'Assign'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setShowAssignVariant(false);
                              setSelectedVariantIdToAssign('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}

                    {variants.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">
                        No variants yet. Add a new variant or assign an
                        existing one.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Variant</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px] text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variants.map((v) => {
                            const isOutOfStock = v.stockQuantity <= 0;
                            return (
                              <TableRow
                                key={v.id}
                                onClick={() => openVariantModal(v.id, v)}
                                className="cursor-pointer hover:bg-surface-light transition-colors"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {v.imageUrl ? (
                                      <img
                                        src={`${API_BASE_URL}${v.imageUrl}`}
                                        alt={v.name}
                                        className="w-8 h-8 object-cover rounded border border-surface-dark"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 bg-surface-light border border-surface-dark rounded flex items-center justify-center text-xs text-gray-400">
                                        —
                                      </div>
                                    )}
                                    <span className="font-medium text-gray-900">
                                      {v.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={
                                      isOutOfStock
                                        ? 'text-error-600 font-semibold'
                                        : ''
                                    }
                                  >
                                    {v.stockQuantity}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {!v.isActive ? (
                                    <StatusBadge status="INACTIVE" />
                                  ) : isOutOfStock ? (
                                    <StatusBadge status="OUT_OF_STOCK" />
                                  ) : (
                                    <StatusBadge status="AVAILABLE" />
                                  )}
                                </TableCell>
                                <TableCell
                                  className="text-right"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() =>
                                      deleteVariantFromComponent(v.id)
                                    }
                                    disabled={
                                      removingVariantId === v.id
                                    }
                                  >
                                    {removingVariantId === v.id
                                      ? '...'
                                      : 'Delete'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </section>
                </>
              )}
            </div>
          )}

          {showDeleteConfirm && componentId && (
            <div className="mt-4 pt-4 border-t border-surface-dark">
              <p className="text-sm text-gray-700 mb-3">
                Delete component &quot;{component?.name}&quot;? All its variants
                will be deleted. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteComponent}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <VariantModal
        open={variantModalOpen}
        onClose={closeVariantModal}
        variantId={variantModalVariantId}
        componentId={componentId ?? undefined}
        initialVariant={variantModalInitial}
        onSaved={handleVariantSaved}
      />
    </>
  );
}
