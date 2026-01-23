'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import { ComponentDto, CreateComponentDto } from '@contracts/core';
import Link from 'next/link';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';

export default function FoodComponentsPage() {
  const [components, setComponents] = useState<ComponentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateComponentDto>({
    name: '',
  });

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getComponents();
      setComponents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load food components');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await apiClient.createComponent(formData);
      setShowCreateForm(false);
      setFormData({ name: '' });
      await loadComponents();
    } catch (err: any) {
      setError(err.message || 'Failed to create food component');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Food Components</h1>
        <p className="mt-1 text-sm text-gray-600 font-normal">Manage food components and their variants</p>
      </div>

      {/* Inline Create Form */}
      <div className="mb-6 bg-surface border border-surface-dark rounded-lg">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-surface-light transition-colors"
        >
          <span className="font-semibold">Create New Food Component</span>
          <span className="text-gray-500">{showCreateForm ? '−' : '+'}</span>
        </button>
        {showCreateForm && (
          <div className="px-6 py-4 border-t border-surface-dark">
            <form onSubmit={handleCreate}>

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Soup, Main Dish, Salad"
                  className="w-full px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create Food Component
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: '' });
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
        <div className="bg-surface border border-surface-dark rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-surface-dark">
                {components.map((component) => (
                  <tr key={component.id} className="hover:bg-surface-light">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{component.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(component.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/food-components/${component.id}/variants`}
                        className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-block"
                      >
                        Manage Variants
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
