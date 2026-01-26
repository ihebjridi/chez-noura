'use client';

import { useState, useEffect } from 'react';
import { useFoodComponents } from '../../hooks/useFoodComponents';
import { CreateComponentDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { CollapsibleForm } from '../../components/ui/collapsible-form';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import Link from 'next/link';
import { Button } from '../../components/ui/button';

export default function FoodComponentsPage() {
  const { components, loading, error, loadComponents, createComponent, setError } = useFoodComponents();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateComponentDto>({
    name: '',
  });

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Food Components"
        description="Manage food components and their variants"
      />

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      <CollapsibleForm
        title="Create New Food Component"
        isOpen={showCreateForm}
        onToggle={() => setShowCreateForm(!showCreateForm)}
        onSubmit={handleCreate}
        onCancel={() => {
          setShowCreateForm(false);
          setFormData({ name: '' });
        }}
        submitLabel="Create Food Component"
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
          <Loading message="Loading food components..." />
        </div>
      ) : components.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No food components found"
            description="Create your first food component to get started."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {components.map((component) => (
            <div
              key={component.id}
              className="bg-surface border border-surface-dark rounded-lg p-6 flex justify-between items-center hover:shadow-sm transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900">{component.name}</h3>
              <Link href={`/food-components/${component.id}/variants`}>
                <Button variant="primary" size="sm">
                  Manage Variants
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
