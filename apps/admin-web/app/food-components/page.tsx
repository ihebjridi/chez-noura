'use client';

import { useState, useEffect } from 'react';
import { useFoodComponents } from '../../hooks/useFoodComponents';
import { CreateComponentDto, ComponentDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { CollapsibleForm } from '../../components/ui/collapsible-form';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { OrderStatisticsCard } from '../../components/statistics/OrderStatisticsCard';
import { useComponentStatistics } from '../../hooks/useComponentStatistics';
import { StatisticsBadge } from '../../components/statistics/StatisticsBadge';
import Link from 'next/link';
import { apiClient } from '../../lib/api-client';
import { VariantDto } from '@contracts/core';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../../components/ui/dialog';

export default function ComponentsPage() {
  const { components, loading, error, loadComponents, createComponent, deleteComponent, setError } = useFoodComponents();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateComponentDto>({
    name: '',
  });
  const [expandedComponentId, setExpandedComponentId] = useState<string | null>(null);
  const [componentVariants, setComponentVariants] = useState<Map<string, VariantDto[]>>(new Map());
  const [deletingComponentId, setDeletingComponentId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  useEffect(() => {
    // Load variants for all components
    const loadVariants = async () => {
      const variantsMap = new Map<string, VariantDto[]>();
      for (const component of components) {
        try {
          const variants = await apiClient.getComponentVariants(component.id);
          variantsMap.set(component.id, variants);
        } catch (err) {
          // Ignore errors for individual components
        }
      }
      setComponentVariants(variantsMap);
    };

    if (components.length > 0) {
      loadVariants();
    }
  }, [components]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await createComponent(formData);
      setShowCreateForm(false);
      setFormData({ name: '' });
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  const { statistics, loading: statsLoading } = useComponentStatistics(
    expandedComponentId
  );

  const handleDeleteClick = (componentId: string) => {
    setDeletingComponentId(componentId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingComponentId) return;
    try {
      setError('');
      await deleteComponent(deletingComponentId);
      setShowDeleteModal(false);
      setDeletingComponentId(null);
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingComponentId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Components"
        description="Manage food components and their variants"
        action={
          <Button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
            }}
          >
            {showCreateForm ? 'Cancel' : '+ New Component'}
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      <CollapsibleForm
        title="Create New Component"
        isOpen={showCreateForm}
        onToggle={() => setShowCreateForm(!showCreateForm)}
        onSubmit={handleCreate}
        onCancel={() => {
          setShowCreateForm(false);
          setFormData({ name: '' });
        }}
        submitLabel="Create Component"
      >
        <FormField label="Name" required>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Soup, Main Dish, Salad"
          />
        </FormField>
      </CollapsibleForm>

      {loading ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading components..." />
        </div>
      ) : components.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No components found"
            description="Create your first component to get started."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {components.map((component) => {
            const variants = componentVariants.get(component.id) || [];
            const isExpanded = expandedComponentId === component.id;

            return (
              <div
                key={component.id}
                className="bg-surface border border-surface-dark rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">{component.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <StatisticsBadge
                          label="Variants"
                          value={variants.length}
                          variant="primary"
                          size="sm"
                        />
                        <StatisticsBadge
                          label="Active Variants"
                          value={variants.filter((v) => v.isActive).length}
                          variant="success"
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/variants?componentId=${component.id}`}>
                        <Button variant="primary" size="sm">
                          Manage Variants
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setExpandedComponentId(isExpanded ? null : component.id)
                        }
                      >
                        {isExpanded ? 'Hide Stats' : 'Show Stats'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteClick(component.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>

                  {isExpanded && statistics && (
                    <div className="mt-4">
                      {statsLoading ? (
                        <div className="p-4">
                          <Loading message="Loading statistics..." />
                        </div>
                      ) : (
                        <OrderStatisticsCard statistics={statistics} type="component" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showDeleteModal} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Component?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this component? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-6">
            {deletingComponentId && components.find(c => c.id === deletingComponentId) && (
              <>Component "{components.find(c => c.id === deletingComponentId)?.name}" will be permanently deleted along with all its variants. If this component has been used in any orders, deletion will be prevented to maintain data integrity.</>
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
