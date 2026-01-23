'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import { MealDto, CreateMealDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';

export default function MealsPage() {
  const [meals, setMeals] = useState<MealDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateMealDto>({
    name: '',
    description: '',
    price: 0,
    availableDate: '',
  });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getMeals();
      setMeals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await apiClient.createMeal(formData);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', price: 0, availableDate: '' });
      await loadMeals();
    } catch (err: any) {
      setError(err.message || 'Failed to create meal');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Meals</h1>
        <p className="mt-1 text-sm text-gray-600 font-normal">Manage individual meals</p>
      </div>

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      {/* Inline Create Form */}
      <div className="mb-6 bg-surface border border-surface-dark rounded-lg">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-surface-light transition-colors"
        >
          <span className="font-semibold">Create New Meal</span>
          <span className="text-gray-500">{showCreateForm ? '−' : '+'}</span>
        </button>
        {showCreateForm && (
          <div className="px-6 py-4 border-t border-surface-dark">
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (TND) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Date *</label>
                  <input
                    type="date"
                    value={formData.availableDate}
                    onChange={(e) => setFormData({ ...formData, availableDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create Meal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: '', description: '', price: 0, availableDate: '' });
                  }}
                  className="px-4 py-2 bg-surface text-gray-700 font-medium rounded-lg hover:bg-surface-dark transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

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
                <p><strong>Available Date:</strong> {new Date(meal.availableDate).toLocaleDateString()}</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  meal.status === 'ACTIVE' ? 'bg-success-50 text-success-700' : 'bg-surface-light text-secondary-700'
                }`}>
                  {meal.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
