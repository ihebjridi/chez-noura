'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import { PackDto, CreatePackDto, UpdatePackDto } from '@contracts/core';
import Link from 'next/link';
import { Error } from '../../components/ui/error';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';

export default function PacksPage() {
  const [packs, setPacks] = useState<PackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPack, setEditingPack] = useState<PackDto | null>(null);
  const [formData, setFormData] = useState<CreatePackDto>({
    name: '',
    price: 0,
    isActive: true,
  });

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getPacks();
      setPacks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load packs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await apiClient.createPack(formData);
      setShowCreateForm(false);
      setFormData({ name: '', price: 0, isActive: true });
      await loadPacks();
    } catch (err: any) {
      setError(err.message || 'Failed to create pack');
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
      await apiClient.updatePack(editingPack.id, updateData);
      setEditingPack(null);
      setFormData({ name: '', price: 0, isActive: true });
      await loadPacks();
    } catch (err: any) {
      setError(err.message || 'Failed to update pack');
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
  };

  const cancelEdit = () => {
    setEditingPack(null);
    setFormData({ name: '', price: 0, isActive: true });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Packs</h1>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            cancelEdit();
          }}
          className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ New Pack'}
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      {/* Inline Create/Edit Form */}
      {(showCreateForm || editingPack) && (
        <div className="mb-6 bg-surface border border-surface-dark rounded-lg">
          {showCreateForm && !editingPack && (
            <div className="px-6 py-4 border-b border-surface-dark">
              <h2 className="text-lg font-semibold">Create Pack</h2>
            </div>
          )}
          {editingPack && (
            <div className="px-6 py-4 border-b border-surface-dark">
              <h2 className="text-lg font-semibold">Edit Pack</h2>
            </div>
          )}
          {(showCreateForm || editingPack) && (
            <form onSubmit={editingPack ? handleUpdate : handleCreate} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (TND) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              {editingPack ? 'Update Pack' : 'Create Pack'}
            </button>
            {editingPack && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-400 text-white font-medium rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
            </form>
          )}
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
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="bg-surface border border-surface-dark rounded-lg p-6 flex justify-between items-center hover:shadow-sm transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{pack.name}</h3>
                  {!pack.isActive && (
                    <span className="px-2 py-1 text-xs font-medium bg-surface-light text-gray-800 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-gray-600 font-normal">
                  <strong>Price:</strong> {pack.price.toFixed(2)} TND
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/packs/${pack.id}/components`}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Manage Components
                </Link>
                <button
                  onClick={() => startEdit(pack)}
                  className="px-4 py-2 bg-secondary-400 text-white text-sm font-medium rounded-lg hover:bg-secondary-500 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
