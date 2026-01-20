'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import { PackDto, CreatePackDto, UpdatePackDto, UserRole } from '@contracts/core';
import Link from 'next/link';

export default function PacksPage() {
  const { logout } = useAuth();
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
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link href="/dashboard" style={{ marginRight: '1rem', textDecoration: 'none' }}>← Dashboard</Link>
            <h1 style={{ display: 'inline', marginLeft: '1rem' }}>Packs</h1>
          </div>
          <div>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                cancelEdit();
              }}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showCreateForm ? 'Cancel' : '+ New Pack'}
            </button>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ccc',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {(showCreateForm || editingPack) && (
          <form onSubmit={editingPack ? handleUpdate : handleCreate} style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '2rem',
            backgroundColor: 'white'
          }}>
            <h2>{editingPack ? 'Edit Pack' : 'Create Pack'}</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Price (TND) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingPack ? 'Update Pack' : 'Create Pack'}
              </button>
              {editingPack && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ccc',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {loading ? (
          <p>Loading packs...</p>
        ) : packs.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            <p>No packs found. Create your first pack to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {packs.map((pack) => (
              <div
                key={pack.id}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{pack.name}</h3>
                    {!pack.isActive && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#fee',
                        color: '#c33',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: '#666' }}>
                    <strong>Price:</strong> {pack.price.toFixed(2)} TND
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    href={`/packs/${pack.id}/components`}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}
                  >
                    Manage Components
                  </Link>
                  <button
                    onClick={() => startEdit(pack)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
