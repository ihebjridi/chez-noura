'use client';

import { useState, useEffect } from 'react';
import { usePacks } from '../../hooks/usePacks';
import { PackDto, CreatePackDto, UpdatePackDto } from '@contracts/core';
import Link from 'next/link';
import { Error } from '../../components/ui/error';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { CollapsibleForm } from '../../components/ui/collapsible-form';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';

export default function PacksPage() {
  const { packs, loading, error, loadPacks, createPack, updatePack, setError } = usePacks();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPack, setEditingPack] = useState<PackDto | null>(null);
  const [formData, setFormData] = useState<CreatePackDto>({
    name: '',
    price: 0,
    isActive: true,
  });

  useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await createPack(formData);
      setShowCreateForm(false);
      setFormData({ name: '', price: 0, isActive: true });
    } catch (err: any) {
      // Error is already set by the hook
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
  };

  const cancelEdit = () => {
    setEditingPack(null);
    setFormData({ name: '', price: 0, isActive: true });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Packs"
        action={
          <Button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              cancelEdit();
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
                  {editingPack ? 'Update Pack' : 'Create Pack'}
                </Button>
                {editingPack && (
                  <Button type="button" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
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
                <Link href={`/packs/${pack.id}/components`}>
                  <Button variant="primary" size="sm">
                    Manage Components
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={() => startEdit(pack)}>
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
