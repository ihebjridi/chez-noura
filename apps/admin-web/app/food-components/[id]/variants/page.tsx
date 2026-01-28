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
import { FormField } from '../../../../components/ui/form-field';
import { Input } from '../../../../components/ui/input';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Button } from '../../../../components/ui/button';
import { StatusBadge } from '../../../../components/ui/status-badge';
import { ArrowLeft, ChevronDown, ChevronUp, Edit2, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../../../../components/ui/dialog';

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
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
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
    if (!editingVariantId) return;
    try {
      setError('');
      const updateData: UpdateVariantDto = {
        name: formData.name,
        stockQuantity: formData.stockQuantity,
        isActive: formData.isActive,
      };
      await apiClient.updateVariant(editingVariantId, updateData, imageFile || undefined);
      setEditingVariantId(null);
      setExpandedVariantId(null);
      setFormData({ name: '', stockQuantity: 0, isActive: true });
      setImageFile(null);
      setImagePreview(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update variant');
    }
  };

  const startEdit = (variant: VariantDto) => {
    setEditingVariantId(variant.id);
    setExpandedVariantId(variant.id);
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
    setEditingVariantId(null);
    setFormData({ name: '', stockQuantity: 0, isActive: true });
    setImageFile(null);
    setImagePreview(null);
  };

  const toggleExpand = (variantId: string) => {
    if (expandedVariantId === variantId) {
      setExpandedVariantId(null);
      setEditingVariantId(null);
      cancelEdit();
    } else {
      setExpandedVariantId(variantId);
      setEditingVariantId(null);
      cancelEdit();
    }
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
        <Link href="/food-components" className="text-primary-600 hover:text-primary-700 mb-2 inline-flex items-center gap-2">
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

      {!showCreateForm && (
        <div className="mb-6">
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Variant
          </Button>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 bg-surface border border-surface-dark rounded-lg">
          <div className="px-6 py-4 border-b border-surface-dark">
            <h2 className="text-lg font-semibold">Create Variant</h2>
          </div>
          <form onSubmit={handleCreate} className="p-6">
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
                Create Variant
              </Button>
              <Button type="button" variant="ghost" onClick={() => {
                setShowCreateForm(false);
                setFormData({ name: '', stockQuantity: 0, isActive: true });
                setImageFile(null);
                setImagePreview(null);
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
        <div className="grid gap-4">
          {variants.map((variant) => {
            const isOutOfStock = variant.stockQuantity <= 0;
            const isExpanded = expandedVariantId === variant.id;
            const isEditing = editingVariantId === variant.id;
            
            return (
              <div
                key={variant.id}
                className={`bg-surface border border-surface-dark rounded-lg overflow-hidden ${
                  isOutOfStock ? 'border-error-300 bg-error-50' : ''
                }`}
              >
                {/* Variant Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Image */}
                      {variant.imageUrl ? (
                        <img
                          src={`${API_BASE_URL}${variant.imageUrl}`}
                          alt={variant.name}
                          className="w-16 h-16 object-cover rounded-md border border-surface-dark flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-surface-light border border-surface-dark rounded-md flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                          No image
                        </div>
                      )}
                      
                      {/* Name and Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{variant.name}</h3>
                          {!variant.isActive ? (
                            <StatusBadge status="INACTIVE" />
                          ) : isOutOfStock ? (
                            <StatusBadge status="OUT_OF_STOCK" />
                          ) : (
                            <StatusBadge status="AVAILABLE" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`font-bold ${
                            isOutOfStock ? 'text-error-600' : 
                            variant.stockQuantity < 10 ? 'text-warning-600' : 
                            'text-success-600'
                          }`}>
                            Stock: {variant.stockQuantity}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleExpand(variant.id)}
                        className="flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            <span className="hidden sm:inline">Hide</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            <span className="hidden sm:inline">Details</span>
                          </>
                        )}
                      </Button>
                      {!isEditing && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => startEdit(variant)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      )}
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
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-surface-dark bg-surface-light">
                    <div className="p-4">
                      {isEditing ? (
                        /* Edit Form */
                        <form onSubmit={handleUpdate} className="space-y-4">
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
                          <div className="flex gap-2 pt-4 border-t border-surface-dark">
                            <Button type="submit" variant="primary">
                              Update Variant
                            </Button>
                            <Button type="button" variant="ghost" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        /* Details View */
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Name</label>
                              <p className="text-sm text-gray-900 mt-1">{variant.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Stock Quantity</label>
                              <p className={`text-sm font-semibold mt-1 ${
                                isOutOfStock ? 'text-error-600' : 
                                variant.stockQuantity < 10 ? 'text-warning-600' : 
                                'text-success-600'
                              }`}>
                                {variant.stockQuantity}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Status</label>
                              <div className="mt-1">
                                {!variant.isActive ? (
                                  <StatusBadge status="INACTIVE" />
                                ) : isOutOfStock ? (
                                  <StatusBadge status="OUT_OF_STOCK" />
                                ) : (
                                  <StatusBadge status="AVAILABLE" />
                                )}
                              </div>
                            </div>
                            {variant.imageUrl && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Image</label>
                                <div className="mt-1">
                                  <img
                                    src={`${API_BASE_URL}${variant.imageUrl}`}
                                    alt={variant.name}
                                    className="w-24 h-24 object-cover rounded-md border border-surface-dark"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Quick Stock Update */}
                          <div className="pt-4 border-t border-surface-dark">
                            <label className="text-sm font-medium text-gray-500 mb-2 block">Quick Stock Update</label>
                            <div className="flex gap-2">
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
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showDeleteModal} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Variant?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this variant? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-6">
            {deletingVariantId && variants.find(v => v.id === deletingVariantId) && (
              <>Variant "{variants.find(v => v.id === deletingVariantId)?.name}" will be permanently deleted. If this variant has been used in any orders, deletion will be prevented to maintain data integrity.</>
            )}
          </p>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
