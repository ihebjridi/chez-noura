'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../../../lib/api-client';
import {
  VariantDto,
  UpdateVariantDto,
  ComponentDto,
} from '@contracts/core';
import { Loading } from '../../../../components/ui/loading';
import { Error } from '../../../../components/ui/error';
import { Empty } from '../../../../components/ui/empty';
import { PageHeader } from '../../../../components/ui/page-header';
import { CollapsibleForm } from '../../../../components/ui/collapsible-form';
import { FormField } from '../../../../components/ui/form-field';
import { Input } from '../../../../components/ui/input';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Button } from '../../../../components/ui/button';
import { StatusBadge } from '../../../../components/ui/status-badge';
import { ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContainer,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../../../../components/ui-layouts/linear-modal';

type VariantFormData = {
  name: string;
  stockQuantity: number;
  isActive: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function FoodComponentVariantsPage() {
  const params = useParams();
  const foodComponentId = params.id as string;

  const [foodComponent, setFoodComponent] = useState<ComponentDto | null>(null);
  const [variants, setVariants] = useState<VariantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantDto | null>(null);
  const [formData, setFormData] = useState<VariantFormData>({
    name: '',
    stockQuantity: 0,
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (foodComponentId) {
      loadData();
    }
  }, [foodComponentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [allFoodComponents, variantsData] = await Promise.all([
        apiClient.getComponents(),
        apiClient.getComponentVariants(foodComponentId),
      ]);
      const foundFoodComponent = allFoodComponents.find((c) => c.id === foodComponentId);
      setFoodComponent(foundFoodComponent || null);
      setVariants(variantsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await apiClient.createVariant(foodComponentId, formData, imageFile || undefined);
      setShowCreateForm(false);
      setFormData({ name: '', stockQuantity: 0, isActive: true });
      setImageFile(null);
      setImagePreview(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create variant');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;
    try {
      setError('');
      const updateData: UpdateVariantDto = {
        name: formData.name,
        stockQuantity: formData.stockQuantity,
        isActive: formData.isActive,
      };
      await apiClient.updateVariant(editingVariant.id, updateData, imageFile || undefined);
      setEditingVariant(null);
      setFormData({ name: '', stockQuantity: 0, isActive: true });
      setImageFile(null);
      setImagePreview(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update variant');
    }
  };

  const startEdit = (variant: VariantDto) => {
    setEditingVariant(variant);
    setFormData({
      name: variant.name,
      stockQuantity: variant.stockQuantity,
      isActive: variant.isActive,
    });
    setImageFile(null);
    setImagePreview(variant.imageUrl ? `${API_BASE_URL}${variant.imageUrl}` : null);
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingVariant(null);
    setFormData({ name: '', stockQuantity: 0, isActive: true });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const quickUpdateStock = async (variantId: string, newStock: number) => {
    try {
      setError('');
      await apiClient.updateVariant(variantId, { stockQuantity: newStock });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update stock');
    }
  };

  const handleDeleteClick = (variantId: string) => {
    setDeletingVariantId(variantId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVariantId) return;
    try {
      setError('');
      await apiClient.deleteVariant(deletingVariantId);
      setShowDeleteModal(false);
      setDeletingVariantId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete variant');
      setShowDeleteModal(false);
      setDeletingVariantId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingVariantId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/components" className="text-primary-600 hover:text-primary-700 mb-2 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Components
        </Link>
        <PageHeader
          title={foodComponent ? `Variants: ${foodComponent.name}` : 'Food Component Variants'}
        />
      </div>

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      {!showCreateForm && !editingVariant && (
        <div className="mb-6">
          <Button onClick={() => setShowCreateForm(true)}>
            + New Variant
          </Button>
        </div>
      )}

      {(showCreateForm || editingVariant) && (
        <div className="mb-6 bg-surface border border-surface-dark rounded-lg">
          {showCreateForm && !editingVariant && (
            <div className="px-6 py-4 border-b border-surface-dark">
              <h2 className="text-lg font-semibold">Create Variant</h2>
            </div>
          )}
          {editingVariant && (
            <div className="px-6 py-4 border-b border-surface-dark">
              <h2 className="text-lg font-semibold">Edit Variant</h2>
            </div>
          )}
          <form onSubmit={editingVariant ? handleUpdate : handleCreate} className="p-6">
            <div className="space-y-4">
              <FormField label="Name" required>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Lentil Soup, Chicken Tagine"
                />
              </FormField>
              <FormField label="Stock Quantity" required>
                <Input
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  required
                />
              </FormField>
              <FormField label="">
                <Checkbox
                  label="Active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
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
                      className="w-32 h-32 object-cover rounded-md border border-surface-dark"
                    />
                  </div>
                )}
              </FormField>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" variant="primary">
                {editingVariant ? 'Update Variant' : 'Create Variant'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => {
                cancelEdit();
                setShowCreateForm(false);
              }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading variants..." />
        </div>
      ) : variants.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No variants found"
            description="Create your first variant to get started."
          />
        </div>
      ) : (
        <div className="bg-surface border border-surface-dark rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quick Stock Update</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-surface-dark">
                {variants.map((variant) => {
                  const isOutOfStock = variant.stockQuantity <= 0;
                  return (
                    <tr
                      key={variant.id}
                      className={`hover:bg-surface-light ${isOutOfStock ? 'bg-error-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {variant.imageUrl ? (
                          <img
                            src={`${API_BASE_URL}${variant.imageUrl}`}
                            alt={variant.name}
                            className="w-16 h-16 object-cover rounded-md border border-surface-dark"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-surface-light border border-surface-dark rounded-md flex items-center justify-center text-xs text-gray-400">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{variant.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-bold ${
                          isOutOfStock ? 'text-error-600' : 
                          variant.stockQuantity < 10 ? 'text-warning-600' : 
                          'text-success-600'
                        }`}>
                          {variant.stockQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!variant.isActive ? (
                          <StatusBadge status="INACTIVE" />
                        ) : isOutOfStock ? (
                          <StatusBadge status="OUT_OF_STOCK" />
                        ) : (
                          <StatusBadge status="AVAILABLE" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => quickUpdateStock(variant.id, variant.stockQuantity - 1)}
                            disabled={variant.stockQuantity <= 0}
                          >
                            -1
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => quickUpdateStock(variant.id, variant.stockQuantity + 1)}
                          >
                            +1
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => quickUpdateStock(variant.id, variant.stockQuantity + 10)}
                          >
                            +10
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => startEdit(variant)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteClick(variant.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog isOpen={showDeleteModal} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContainer>
          <DialogContent className="bg-surface border border-surface-dark rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <DialogClose className="text-gray-600 hover:text-gray-800" />
            <DialogTitle className="text-xl font-semibold mb-4 text-destructive">Delete Variant?</DialogTitle>
            <DialogDescription className="text-gray-600 mb-4">
              Are you sure you want to delete this variant? This action cannot be undone.
            </DialogDescription>
            <p className="text-sm text-gray-500 mb-6">
              {deletingVariantId && variants.find(v => v.id === deletingVariantId) && (
                <>Variant "{variants.find(v => v.id === deletingVariantId)?.name}" will be permanently deleted. If this variant has been used in any orders, deletion will be prevented to maintain data integrity.</>
              )}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-destructive text-white rounded hover:bg-destructive-hover transition-colors"
              >
                Delete
              </button>
            </div>
          </DialogContent>
        </DialogContainer>
      </Dialog>
    </div>
  );
}
