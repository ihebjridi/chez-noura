'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePacks } from '../../hooks/usePacks';
import { useFoodComponents } from '../../hooks/useFoodComponents';
import { PackDto, CreatePackDto, UpdatePackDto, ComponentDto, CreatePackComponentDto } from '@contracts/core';
import Link from 'next/link';
import { Error } from '../../components/ui/error';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { OrderStatisticsCard } from '../../components/statistics/OrderStatisticsCard';
import { usePackStatistics } from '../../hooks/usePackStatistics';
import { StatisticsBadge } from '../../components/statistics/StatisticsBadge';
import { apiClient } from '../../lib/api-client';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface SelectedComponent {
  componentId: string;
  componentName: string;
  required: boolean;
  orderIndex: number;
}

export default function PacksPage() {
  const { packs, loading, error, loadPacks, createPack, updatePack, setError } = usePacks();
  const { components, loadComponents } = useFoodComponents();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPack, setEditingPack] = useState<PackDto | null>(null);
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePackDto>({
    name: '',
    price: 0,
    isActive: true,
  });
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [creatingPack, setCreatingPack] = useState(false);

  useEffect(() => {
    loadPacks();
    loadComponents();
  }, [loadPacks, loadComponents]);

  const { statistics, loading: statsLoading } = usePackStatistics(expandedPackId);

  const handleComponentToggle = (component: ComponentDto) => {
    const existing = selectedComponents.find((sc) => sc.componentId === component.id);
    if (existing) {
      setSelectedComponents(selectedComponents.filter((sc) => sc.componentId !== component.id));
    } else {
      const maxOrderIndex = selectedComponents.length > 0
        ? Math.max(...selectedComponents.map((sc) => sc.orderIndex))
        : -1;
      setSelectedComponents([
        ...selectedComponents,
        {
          componentId: component.id,
          componentName: component.name,
          required: true,
          orderIndex: maxOrderIndex + 1,
        },
      ]);
    }
  };

  const handleComponentOrderChange = (index: number, direction: 'up' | 'down') => {
    const newComponents = [...selectedComponents];
    if (direction === 'up' && index > 0) {
      [newComponents[index - 1], newComponents[index]] = [newComponents[index], newComponents[index - 1]];
      newComponents[index - 1].orderIndex = index - 1;
      newComponents[index].orderIndex = index;
    } else if (direction === 'down' && index < newComponents.length - 1) {
      [newComponents[index], newComponents[index + 1]] = [newComponents[index + 1], newComponents[index]];
      newComponents[index].orderIndex = index;
      newComponents[index + 1].orderIndex = index + 1;
    }
    setSelectedComponents(newComponents);
  };

  const handleComponentRequiredToggle = (componentId: string) => {
    setSelectedComponents(
      selectedComponents.map((sc) =>
        sc.componentId === componentId ? { ...sc, required: !sc.required } : sc
      )
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComponents.length === 0) {
      setError('Please select at least one component');
      return;
    }

    try {
      setCreatingPack(true);
      setError('');
      
      // First create the pack
      const newPack = await createPack(formData);
      
      // Then add components to the pack
      for (const selectedComponent of selectedComponents) {
        await apiClient.addPackComponent(newPack.id, {
          componentId: selectedComponent.componentId,
          required: selectedComponent.required,
          orderIndex: selectedComponent.orderIndex,
        });
      }
      
      setShowCreateForm(false);
      setFormData({ name: '', price: 0, isActive: true });
      setSelectedComponents([]);
    } catch (err: any) {
      // Error is already set by the hook
    } finally {
      setCreatingPack(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPack) return;
    try {
      setError('');
      const updateData: UpdatePackDto = {
        name: formData.name,
        price: formData.price,
        isActive: formData.isActive,
      };
      await updatePack(editingPack.id, updateData);
      setEditingPack(null);
      setFormData({ name: '', price: 0, isActive: true });
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  const startEdit = (pack: PackDto) => {
    setEditingPack(pack);
    setFormData({
      name: pack.name,
      price: pack.price,
      isActive: pack.isActive,
    });
    setShowCreateForm(false);
    setSelectedComponents([]);
  };

  const cancelEdit = () => {
    setEditingPack(null);
    setFormData({ name: '', price: 0, isActive: true });
    setSelectedComponents([]);
  };

  const cancelCreate = () => {
    setShowCreateForm(false);
    setFormData({ name: '', price: 0, isActive: true });
    setSelectedComponents([]);
  };

  const sortedSelectedComponents = useMemo(() => {
    return [...selectedComponents].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [selectedComponents]);

  const availableComponents = useMemo(() => {
    const selectedIds = new Set(selectedComponents.map((sc) => sc.componentId));
    return components.filter((c) => !selectedIds.has(c.id));
  }, [components, selectedComponents]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Packs"
        action={
          <Button
            onClick={() => {
              if (showCreateForm) {
                cancelCreate();
              } else {
                setShowCreateForm(true);
                cancelEdit();
              }
            }}
          >
            {showCreateForm ? 'Cancel' : '+ New Pack'}
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 bg-surface border border-surface-dark rounded-lg">
          <div className="px-6 py-4 border-b border-surface-dark">
            <h2 className="text-lg font-semibold">Create Pack</h2>
          </div>
          <form onSubmit={handleCreate} className="p-6">
            <div className="space-y-6">
              {/* Pack Basic Info */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-700">Pack Information</h3>
                <FormField label="Name" required>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Standard Pack, Premium Pack"
                  />
                </FormField>
                <FormField label="Price (TND)" required>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
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
              </div>

              {/* Component Selection */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-700">Select Components</h3>
                {availableComponents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availableComponents.map((component) => (
                      <button
                        key={component.id}
                        type="button"
                        onClick={() => handleComponentToggle(component)}
                        className="p-3 text-left border border-surface-dark rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-colors"
                      >
                        <Checkbox
                          label={component.name}
                          checked={false}
                          onChange={() => {}}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">All components have been added to this pack.</p>
                )}
              </div>

              {/* Selected Components with Ordering */}
              {sortedSelectedComponents.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-700">Pack Structure (Order)</h3>
                  <div className="space-y-2">
                    {sortedSelectedComponents.map((selectedComponent, index) => (
                      <div
                        key={selectedComponent.componentId}
                        className="flex items-center gap-2 p-3 bg-surface-light border border-surface-dark rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => handleComponentOrderChange(index, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-surface-dark rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleComponentOrderChange(index, 'down')}
                              disabled={index === sortedSelectedComponents.length - 1}
                              className="p-1 hover:bg-surface-dark rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {index + 1}. {selectedComponent.componentName}
                            </div>
                            <Checkbox
                              label="Required"
                              checked={selectedComponent.required}
                              onChange={() => handleComponentRequiredToggle(selectedComponent.componentId)}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleComponentToggle({ id: selectedComponent.componentId, name: selectedComponent.componentName } as ComponentDto)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              {sortedSelectedComponents.length > 0 && (
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-primary-900 mb-2">Pack Preview</h4>
                  <div className="text-sm text-primary-700">
                    <div className="font-medium mb-1">{formData.name || 'New Pack'}</div>
                    <div className="text-xs opacity-75">
                      {sortedSelectedComponents.length} component{sortedSelectedComponents.length !== 1 ? 's' : ''}
                      {' • '}
                      {sortedSelectedComponents.filter((sc) => sc.required).length} required
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button type="submit" variant="primary" disabled={creatingPack || selectedComponents.length === 0}>
                {creatingPack ? 'Creating...' : 'Create Pack'}
              </Button>
              <Button type="button" variant="ghost" onClick={cancelCreate}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {editingPack && (
        <div className="mb-6 bg-surface border border-surface-dark rounded-lg">
          <div className="px-6 py-4 border-b border-surface-dark">
            <h2 className="text-lg font-semibold">Edit Pack</h2>
          </div>
          <form onSubmit={handleUpdate} className="p-6">
            <div className="space-y-4">
              <FormField label="Name" required>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Price (TND)" required>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
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
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" variant="primary">
                Update Pack
              </Button>
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading packs..." />
        </div>
      ) : packs.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No packs found"
            description="Create your first pack to get started."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {packs.map((pack) => {
            const isExpanded = expandedPackId === pack.id;
            return (
              <div
                key={pack.id}
                className="bg-surface border border-surface-dark rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{pack.name}</h3>
                        {!pack.isActive && (
                          <span className="px-2 py-1 text-xs font-medium bg-surface-light text-gray-800 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <StatisticsBadge
                          label="Price"
                          value={`${pack.price.toFixed(2)} TND`}
                          variant="primary"
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/packs/${pack.id}/components`}>
                        <Button variant="primary" size="sm">
                          Manage Components
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setExpandedPackId(isExpanded ? null : pack.id)}
                      >
                        {isExpanded ? 'Hide Stats' : 'Show Stats'}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => startEdit(pack)}>
                        Edit
                      </Button>
                    </div>
                  </div>

                  {isExpanded && statistics && statistics.packId === pack.id && (
                    <div className="mt-4">
                      {statsLoading ? (
                        <Loading message="Loading statistics..." />
                      ) : (
                        <OrderStatisticsCard statistics={statistics} type="pack" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
