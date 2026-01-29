'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import {
  VariantDto,
  ComponentDto,
  UpdateVariantDto,
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
import { Trash2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type FormData = {
  name: string;
  stockQuantity: number;
  isActive: boolean;
  componentId?: string;
};

export interface VariantModalProps {
  open: boolean;
  onClose: () => void;
  variantId: string | null;
  componentId?: string;
  initialVariant?: VariantDto | null;
  onSaved?: () => void;
}

export function VariantModal({
  open,
  onClose,
  variantId,
  componentId: prefilledComponentId,
  initialVariant,
  onSaved,
}: VariantModalProps) {
  const isCreate = variantId === null;

  const [variant, setVariant] = useState<VariantDto | null>(initialVariant ?? null);
  const [components, setComponents] = useState<ComponentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    stockQuantity: 0,
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updatingStock, setUpdatingStock] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (isCreate) {
      setFormData({
        name: '',
        stockQuantity: 0,
        isActive: true,
        componentId: prefilledComponentId,
      });
      setImageFile(null);
      setImagePreview(null);
      setVariant(null);
    } else {
      setVariant(initialVariant ?? null);
    }
  }, [open, variantId, isCreate, prefilledComponentId, initialVariant]);

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

        if (!isCreate && variantId) {
          let foundVariant: VariantDto | null = null;
          if (initialVariant && initialVariant.id === variantId) {
            foundVariant = initialVariant;
          } else {
            const allVariants: VariantDto[] = [];
            for (const c of comps) {
              const vs = await apiClient.getComponentVariants(c.id);
              allVariants.push(...vs);
            }
            foundVariant = allVariants.find((v) => v.id === variantId) ?? null;
          }
          if (!cancelled) {
            setVariant(foundVariant);
            if (foundVariant) {
              setFormData({
                name: foundVariant.name,
                stockQuantity: foundVariant.stockQuantity,
                isActive: foundVariant.isActive,
                componentId: foundVariant.componentId,
              });
              setImagePreview(
                foundVariant.imageUrl
                  ? `${API_BASE_URL}${foundVariant.imageUrl}`
                  : null,
              );
            }
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
  }, [open, variantId, isCreate, initialVariant]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isCreate) {
      const compId = formData.componentId ?? prefilledComponentId;
      if (!compId?.trim()) {
        setError('Please select a component');
        return;
      }
      try {
        setSaving(true);
        await apiClient.createVariant(
          compId,
          {
            name: formData.name,
            stockQuantity: formData.stockQuantity,
            isActive: formData.isActive,
          },
          imageFile || undefined,
        );
        onSaved?.();
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to create variant');
      } finally {
        setSaving(false);
      }
    } else if (variantId) {
      try {
        setSaving(true);
        const updateData: UpdateVariantDto = {
          name: formData.name,
          stockQuantity: formData.stockQuantity,
          isActive: formData.isActive,
          ...(formData.componentId !== undefined && {
            componentId: formData.componentId,
          }),
        };
        const updated = await apiClient.updateVariant(
          variantId,
          updateData,
          imageFile || undefined,
        );
        setVariant((prev) =>
          prev
            ? {
                ...prev,
                ...updateData,
                componentName:
                  components.find((c) => c.id === formData.componentId)?.name ??
                  prev.componentName,
              }
            : null,
        );
        setImageFile(null);
        onSaved?.();
      } catch (err: any) {
        setError(err.message || 'Failed to update variant');
      } finally {
        setSaving(false);
      }
    }
  };

  const quickUpdateStock = async (delta: number) => {
    if (!variant) return;
    const newStock = Math.max(0, variant.stockQuantity + delta);
    try {
      setUpdatingStock(true);
      setError('');
      await apiClient.updateVariant(variant.id, { stockQuantity: newStock });
      setVariant((prev) => (prev ? { ...prev, stockQuantity: newStock } : null));
      onSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to update stock');
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!variantId) return;
    try {
      setDeleting(true);
      setError('');
      await apiClient.deleteVariant(variantId);
      setShowDeleteConfirm(false);
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete variant');
    } finally {
      setDeleting(false);
    }
  };

  const isOutOfStock = variant ? variant.stockQuantity <= 0 : false;
  const isLowStock =
    variant && variant.stockQuantity > 0 && variant.stockQuantity < 10;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? 'New Variant' : variant ? variant.name : 'Variant'}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Create a variant for a food component. Choose the component, then set name, stock, and optional image.'
              : 'View or edit this variant.'}
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
        ) : isCreate ? (
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <FormField label="Component" required>
              <select
                value={formData.componentId ?? prefilledComponentId ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    componentId: e.target.value || undefined,
                  }))
                }
                required
                className="w-full px-3 py-2 border border-surface-dark rounded-md bg-surface text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select component</option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Name" required>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                placeholder="e.g., Lentil Soup, Chicken Tagine"
              />
            </FormField>
            <FormField label="Stock Quantity" required>
              <Input
                type="number"
                min={0}
                value={formData.stockQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stockQuantity: parseInt(e.target.value, 10) || 0,
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
                  setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
            </FormField>
            <FormField label="Image">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-md border border-surface-dark"
                  />
                </div>
              )}
            </FormField>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Variant'}
              </Button>
            </DialogFooter>
          </form>
        ) : variant ? (
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <FormField label="Component">
              <select
                value={formData.componentId ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    componentId: e.target.value || undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-surface-dark rounded-md bg-surface text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Name" required>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </FormField>
            <FormField label="Stock Quantity" required>
              <Input
                type="number"
                min={0}
                value={formData.stockQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stockQuantity: parseInt(e.target.value, 10) || 0,
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
                  setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
            </FormField>
            <FormField label="Image">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-md border border-surface-dark"
                  />
                </div>
              )}
            </FormField>
            <div className="pt-4 border-t border-surface-dark">
              <label className="text-sm font-medium text-gray-500 mb-2 block">
                Quick Stock
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => quickUpdateStock(-1)}
                  disabled={variant.stockQuantity <= 0 || updatingStock}
                >
                  -1
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => quickUpdateStock(1)}
                  disabled={updatingStock}
                >
                  +1
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => quickUpdateStock(10)}
                  disabled={updatingStock}
                >
                  +10
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-4 text-sm text-gray-500">
            Variant not found.
            <div className="mt-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}

        {showDeleteConfirm && variant && (
          <div className="mt-4 pt-4 border-t border-surface-dark">
            <p className="text-sm text-gray-700 mb-3">
              Delete variant &quot;{variant.name}&quot;? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
