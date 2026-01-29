'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import {
  PackDto,
  PackComponentDto,
  CreatePackDto,
  UpdatePackDto,
  CreatePackComponentDto,
  ComponentDto,
  VariantDto,
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
import { Checkbox } from '../ui/checkbox';
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
import { Trash2, Plus, Package } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface PackModalProps {
  open: boolean;
  onClose: () => void;
  packId: string | null;
  onSaved?: () => void;
}

export function PackModal({
  open,
  onClose,
  packId,
  onSaved,
}: PackModalProps) {
  const isCreate = packId === null;

  const [pack, setPack] = useState<PackDto | null>(null);
  const [packComponents, setPackComponents] = useState<PackComponentDto[]>([]);
  const [components, setComponents] = useState<ComponentDto[]>([]);
  const [variantsByComponentId, setVariantsByComponentId] = useState<
    Map<string, VariantDto[]>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreatePackDto>({
    name: '',
    price: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [addComponentForm, setAddComponentForm] =
    useState<CreatePackComponentDto>({
      componentId: '',
      required: true,
      orderIndex: 0,
    });
  const [adding, setAdding] = useState(false);
  const [removingComponentId, setRemovingComponentId] = useState<string | null>(
    null,
  );

  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantModalVariantId, setVariantModalVariantId] = useState<
    string | null
  >(null);
  const [variantModalComponentId, setVariantModalComponentId] = useState<
    string | undefined
  >(undefined);
  const [variantModalInitial, setVariantModalInitial] =
    useState<VariantDto | null>(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (isCreate) {
      setPack(null);
      setPackComponents([]);
      setFormData({ name: '', price: 0, isActive: true });
      setVariantsByComponentId(new Map());
    }
  }, [open, packId, isCreate]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const comps = await apiClient.getComponents();
        if (cancelled) return;
        setComponents(comps);

        if (isCreate) {
          setLoading(false);
          return;
        }

        if (packId) {
          const [packData, packCompsData] = await Promise.all([
            apiClient.getPackById(packId),
            apiClient.getPackComponents(packId),
          ]);
          if (cancelled) return;
          setPack(packData as PackDto);
          setFormData({
            name: packData.name,
            price: packData.price,
            isActive: packData.isActive,
          });
          const sorted = [...(packCompsData as PackComponentDto[])].sort(
            (a, b) => a.orderIndex - b.orderIndex,
          );
          setPackComponents(sorted);

          const variantMap = new Map<string, VariantDto[]>();
          for (const pc of sorted) {
            const vs = await apiClient.getComponentVariants(pc.componentId);
            variantMap.set(pc.componentId, vs);
          }
          if (!cancelled) setVariantsByComponentId(variantMap);
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
  }, [open, packId, isCreate]);

  const [selectedForCreate, setSelectedForCreate] = useState<
    { componentId: string; componentName: string; required: boolean; orderIndex: number }[]
  >([]);

  useEffect(() => {
    if (open && isCreate) setSelectedForCreate([]);
  }, [open, isCreate]);

  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isCreate) {
      try {
        setSaving(true);
        const newPack = await apiClient.createPack(formData);
        for (const sc of selectedForCreate) {
          await apiClient.addPackComponent(newPack.id, {
            componentId: sc.componentId,
            required: sc.required,
            orderIndex: sc.orderIndex,
          });
        }
        onSaved?.();
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to create pack');
      } finally {
        setSaving(false);
      }
    } else if (packId) {
      try {
        setSaving(true);
        await apiClient.updatePack(packId, {
          name: formData.name,
          price: formData.price,
          isActive: formData.isActive,
        });
        setPack((prev) =>
          prev
            ? { ...prev, ...formData }
            : null,
        );
        onSaved?.();
      } catch (err: any) {
        setError(err.message || 'Failed to update pack');
      } finally {
        setSaving(false);
      }
    }
  };

  const availableComponentsForAdd = components.filter(
    (c) => !packComponents.some((pc) => pc.componentId === c.id),
  );

  const openAddComponent = () => {
    const maxOrder =
      packComponents.length > 0
        ? Math.max(...packComponents.map((pc) => pc.orderIndex))
        : -1;
    setAddComponentForm({
      componentId: availableComponentsForAdd[0]?.id ?? '',
      required: true,
      orderIndex: maxOrder + 1,
    });
    setShowAddComponent(true);
  };

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packId || !addComponentForm.componentId?.trim()) return;
    try {
      setAdding(true);
      setError('');
      await apiClient.addPackComponent(packId, addComponentForm);
      setShowAddComponent(false);
      const packComps = await apiClient.getPackComponents(packId);
      const sorted = [...packComps].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
      setPackComponents(sorted);
      const vs = await apiClient.getComponentVariants(
        addComponentForm.componentId,
      );
      setVariantsByComponentId((prev) => {
        const next = new Map(prev);
        next.set(addComponentForm.componentId, vs);
        return next;
      });
      onSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to add component');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveComponent = async (componentId: string) => {
    if (!packId) return;
    try {
      setRemovingComponentId(componentId);
      setError('');
      await apiClient.removePackComponent(packId, componentId);
      const packComps = await apiClient.getPackComponents(packId);
      setPackComponents(
        [...packComps].sort((a, b) => a.orderIndex - b.orderIndex),
      );
      setVariantsByComponentId((prev) => {
        const next = new Map(prev);
        next.delete(componentId);
        return next;
      });
      onSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to remove component');
    } finally {
      setRemovingComponentId(null);
    }
  };

  const openVariantModal = (
    variantId: string | null,
    componentId?: string,
    initial?: VariantDto | null,
  ) => {
    setVariantModalVariantId(variantId);
    setVariantModalComponentId(componentId);
    setVariantModalInitial(initial ?? null);
    setVariantModalOpen(true);
  };

  const closeVariantModal = () => {
    setVariantModalOpen(false);
    setVariantModalVariantId(null);
    setVariantModalComponentId(undefined);
    setVariantModalInitial(null);
  };

  const handleVariantSaved = async () => {
    if (!packId) return;
    const variantMap = new Map<string, VariantDto[]>();
    for (const pc of packComponents) {
      const vs = await apiClient.getComponentVariants(pc.componentId);
      variantMap.set(pc.componentId, vs);
    }
    setVariantsByComponentId(variantMap);
    onSaved?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreate ? 'New Pack' : pack ? pack.name : 'Pack'}
            </DialogTitle>
            <DialogDescription>
              {isCreate
                ? 'Create a pack with name, price, and components.'
                : 'View or edit this pack, its components, and their variants.'}
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
                  Pack
                </h3>
                <form onSubmit={handleSavePack} className="space-y-4">
                  <FormField label="Name" required>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                      placeholder="e.g., Standard Pack"
                    />
                  </FormField>
                  <FormField label="Price (TND)" required>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: parseFloat(e.target.value) || 0,
                        }))
                      }
                      required
                    />
                  </FormField>
                  <FormField label="">
                    <Checkbox
                      label="Active"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                    />
                  </FormField>
                  {!isCreate && (
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </form>

                {isCreate && (
                  <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Components to include
                    </h4>
                    {components.filter((c) => !selectedForCreate.some((s) => s.componentId === c.id)).length > 0 && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const compId = addComponentForm.componentId;
                          if (!compId) return;
                          const comp = components.find((c) => c.id === compId);
                          if (!comp) return;
                          const nextSelected = [
                            ...selectedForCreate,
                            {
                              componentId: comp.id,
                              componentName: comp.name,
                              required: addComponentForm.required,
                              orderIndex:
                                selectedForCreate.length > 0
                                  ? Math.max(...selectedForCreate.map((s) => s.orderIndex)) + 1
                                  : 0,
                            },
                          ];
                          setSelectedForCreate(nextSelected);
                          setAddComponentForm({
                            componentId: components.find((c) => !nextSelected.some((s) => s.componentId === c.id))?.id ?? '',
                            required: true,
                            orderIndex: 0,
                          });
                        }}
                        className="flex flex-wrap items-end gap-3 p-3 bg-surface-light rounded-lg"
                      >
                        <FormField label="Component">
                          <select
                            value={addComponentForm.componentId}
                            onChange={(e) =>
                              setAddComponentForm((prev) => ({
                                ...prev,
                                componentId: e.target.value,
                              }))
                            }
                            className="w-48 px-3 py-2 border border-surface-dark rounded-md bg-surface text-gray-900"
                          >
                            <option value="">Select</option>
                            {components
                              .filter((c) => !selectedForCreate.some((s) => s.componentId === c.id))
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </FormField>
                        <FormField label="Required">
                          <Checkbox
                            label=""
                            checked={addComponentForm.required}
                            onChange={(e) =>
                              setAddComponentForm((prev) => ({
                                ...prev,
                                required: e.target.checked,
                              }))
                            }
                          />
                        </FormField>
                        <Button type="submit" variant="secondary" size="sm">
                          Add to pack
                        </Button>
                      </form>
                    )}
                    {selectedForCreate.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {[...selectedForCreate]
                          .sort((a, b) => a.orderIndex - b.orderIndex)
                          .map((sc, idx) => (
                            <li
                              key={sc.componentId}
                              className="flex items-center justify-between py-1 border-b border-surface-dark last:border-0"
                            >
                              <span>
                                {idx + 1}. {sc.componentName}
                                {sc.required && ' (required)'}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setSelectedForCreate((prev) =>
                                    prev.filter((p) => p.componentId !== sc.componentId),
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                      </ul>
                    )}
                    <DialogFooter className="border-t border-surface-dark pt-4">
                      <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        disabled={saving}
                        onClick={() =>
                          handleSavePack({
                            preventDefault: () => {},
                          } as React.FormEvent)
                        }
                      >
                        {saving ? 'Creating...' : 'Create Pack'}
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </section>

              {!isCreate && packId && (
                <>
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Components in this pack
                    </h3>
                    {availableComponentsForAdd.length > 0 && (
                      <div className="mb-3">
                        {!showAddComponent ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={openAddComponent}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            Assign existing component
                          </Button>
                        ) : (
                          <form
                            onSubmit={handleAddComponent}
                            className="p-4 bg-surface-light border border-surface-dark rounded-lg space-y-3 flex flex-wrap items-end gap-3"
                          >
                            <FormField label="Component" className="min-w-[200px]">
                              <select
                                value={addComponentForm.componentId}
                                onChange={(e) =>
                                  setAddComponentForm((prev) => ({
                                    ...prev,
                                    componentId: e.target.value,
                                  }))
                                }
                                required
                                className="w-full px-3 py-2 border border-surface-dark rounded-md bg-surface text-gray-900"
                              >
                                <option value="">
                                  Select component
                                </option>
                                {availableComponentsForAdd.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </FormField>
                            <FormField label="Order">
                              <Input
                                type="number"
                                min={0}
                                value={addComponentForm.orderIndex}
                                onChange={(e) =>
                                  setAddComponentForm((prev) => ({
                                    ...prev,
                                    orderIndex: parseInt(
                                      e.target.value,
                                      10,
                                    ) || 0,
                                  }))
                                }
                                className="w-20"
                              />
                            </FormField>
                            <FormField label="">
                              <Checkbox
                                label="Required"
                                checked={addComponentForm.required}
                                onChange={(e) =>
                                  setAddComponentForm((prev) => ({
                                    ...prev,
                                    required: e.target.checked,
                                  }))
                                }
                              />
                            </FormField>
                            <div className="flex gap-2">
                              <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={adding}
                              >
                                {adding ? 'Adding...' : 'Add'}
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowAddComponent(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {packComponents.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">
                        No components in this pack. Add an existing component
                        above.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Component</TableHead>
                            <TableHead>Required</TableHead>
                            <TableHead className="w-24 text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {packComponents.map((pc) => (
                            <TableRow key={pc.id}>
                              <TableCell>{pc.orderIndex}</TableCell>
                              <TableCell className="font-medium">
                                {pc.componentName}
                              </TableCell>
                              <TableCell>
                                {pc.required ? (
                                  <span className="text-xs font-medium text-error-700 bg-error-50 px-2 py-1 rounded">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-600">
                                    No
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveComponent(pc.componentId)
                                  }
                                  disabled={
                                    removingComponentId === pc.componentId
                                  }
                                >
                                  {removingComponentId === pc.componentId
                                    ? '...'
                                    : 'Remove'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Variants per component
                    </h3>
                    {packComponents.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">
                        Add components above to manage their variants here.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {packComponents.map((pc) => {
                          const variants =
                            variantsByComponentId.get(pc.componentId) ?? [];
                          return (
                            <div
                              key={pc.componentId}
                              className="border border-surface-dark rounded-lg overflow-hidden"
                            >
                              <div className="px-4 py-2 bg-surface-light border-b border-surface-dark flex items-center justify-between">
                                <span className="font-medium text-gray-900">
                                  {pc.componentName}
                                </span>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() =>
                                    openVariantModal(
                                      null,
                                      pc.componentId,
                                      null,
                                    )
                                  }
                                  className="flex items-center gap-1"
                                >
                                  <Plus className="h-4 w-4" />
                                  New variant
                                </Button>
                              </div>
                              {variants.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500">
                                  No variants. Add one above.
                                </div>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Variant</TableHead>
                                      <TableHead>Stock</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="w-24" />
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {variants.map((v) => {
                                      const isOutOfStock =
                                        v.stockQuantity <= 0;
                                      return (
                                        <TableRow
                                          key={v.id}
                                          onClick={() =>
                                            openVariantModal(
                                              v.id,
                                              pc.componentId,
                                              v,
                                            )
                                          }
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
                                              <span
                                                className={
                                                  isOutOfStock
                                                    ? 'text-error-600 font-medium'
                                                    : ''
                                                }
                                              >
                                                {v.name}
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            {v.stockQuantity}
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
                                          <TableCell className="text-right" />
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <VariantModal
        open={variantModalOpen}
        onClose={closeVariantModal}
        variantId={variantModalVariantId}
        componentId={variantModalComponentId}
        initialVariant={variantModalInitial}
        onSaved={handleVariantSaved}
      />
    </>
  );
}
