'use client';

import { useState, useEffect } from 'react';
import { useMeals } from '../../hooks/useMeals';
import { CreateMealDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { CollapsibleForm } from '../../components/ui/collapsible-form';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { DateInput } from '../../components/ui/date-input';
import { StatusBadge } from '../../components/ui/status-badge';
import { formatDateOnly } from '../../lib/date-utils';

export default function MealsPage() {
  const { meals, loading, error, loadMeals, createMeal, setError } = useMeals();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateMealDto>({
    name: '',
    description: '',
    price: 0,
    availableDate: '',
  });

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await createMeal(formData);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', price: 0, availableDate: '' });
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Meals"
        description="Manage individual meals"
      />

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      <CollapsibleForm
        title="Create New Meal"
        isOpen={showCreateForm}
        onToggle={() => setShowCreateForm(!showCreateForm)}
        onSubmit={handleCreate}
        onCancel={() => {
          setShowCreateForm(false);
          setFormData({ name: '', description: '', price: 0, availableDate: '' });
        }}
        submitLabel="Create Meal"
      >
        <div className="space-y-4">
          <FormField label="Name" required>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
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
          <FormField label="Available Date" required>
            <DateInput
              value={formData.availableDate}
              onChange={(e) => setFormData({ ...formData, availableDate: e.target.value })}
              required
            />
          </FormField>
        </div>
      </CollapsibleForm>

      {loading ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading meals..." />
        </div>
      ) : meals.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No meals found"
            description="Create your first meal to get started."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="bg-surface border border-surface-dark rounded-lg p-6 hover:shadow-sm transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{meal.name}</h3>
              {meal.description && <p className="text-gray-600 mb-2 font-normal">{meal.description}</p>}
              <div className="flex items-center gap-4 text-sm text-gray-600 font-normal">
                <p><strong>Price:</strong> {meal.price} TND</p>
                <p><strong>Available Date:</strong> {formatDateOnly(meal.availableDate)}</p>
                <StatusBadge status={meal.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
