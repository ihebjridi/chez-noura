'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../../../components/protected-route';
import { useAuth } from '../../../../contexts/auth-context';
import { apiClient } from '../../../../lib/api-client';
import {
  VariantDto,
  UpdateVariantDto,
  ComponentDto,
  UserRole,
} from '@contracts/core';

// Form data type (without componentId since it comes from URL)
type VariantFormData = {
  name: string;
  stockQuantity: number;
  isActive: boolean;
};
import Link from 'next/link';

export default function ComponentVariantsPage() {
  const { logout } = useAuth();
  const params = useParams();
  const router = useRouter();
  const componentId = params.id as string;

  const [component, setComponent] = useState<ComponentDto | null>(null);
  const [variants, setVariants] = useState<VariantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantDto | null>(null);
  const [formData, setFormData] = useState<VariantFormData>({
    name: '',
    stockQuantity: 0,
    isActive: true,
  });

  useEffect(() => {
    if (componentId) {
      loadData();
    }
  }, [componentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [allComponents, variantsData] = await Promise.all([
        apiClient.getComponents(),
        apiClient.getComponentVariants(componentId),
      ]);
      const foundComponent = allComponents.find((c) => c.id === componentId);
      setComponent(foundComponent || null);
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
      // componentId is passed as URL parameter, not in form data
      await apiClient.createVariant(componentId, formData);
      setShowCreateForm(false);
      setFormData({ name: '', stockQuantity: 0, isActive: true });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create variant');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;
    try {
      setError('');
      const updateData: UpdateVariantDto = {
        name: formData.name,
        stockQuantity: formData.stockQuantity,
        isActive: formData.isActive,
      };
      await apiClient.updateVariant(editingVariant.id, updateData);
      setEditingVariant(null);
      setFormData({ name: '', stockQuantity: 0, isActive: true });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update variant');
    }
  };

  const startEdit = (variant: VariantDto) => {
    setEditingVariant(variant);
    setFormData({
      name: variant.name,
      stockQuantity: variant.stockQuantity,
      isActive: variant.isActive,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingVariant(null);
    setFormData({ name: '', stockQuantity: 0, isActive: true });
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

  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link href="/components" style={{ marginRight: '1rem', textDecoration: 'none' }}>← Components</Link>
            <h1 style={{ display: 'inline', marginLeft: '1rem' }}>
              {component ? `Variants: ${component.name}` : 'Component Variants'}
            </h1>
          </div>
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

        {(showCreateForm || editingVariant) && (
          <form onSubmit={editingVariant ? handleUpdate : handleCreate} style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '2rem',
            backgroundColor: 'white'
          }}>
            <h2>{editingVariant ? 'Edit Variant' : 'Create Variant'}</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="e.g., Lentil Soup, Chicken Tagine"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Stock Quantity *</label>
              <input
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
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
                {editingVariant ? 'Update Variant' : 'Create Variant'}
              </button>
              {(editingVariant || showCreateForm) && (
                <button
                  type="button"
                  onClick={() => {
                    cancelEdit();
                    setShowCreateForm(false);
                  }}
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

        {!showCreateForm && !editingVariant && (
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '0.5rem 1rem',
              marginBottom: '1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + New Variant
          </button>
        )}

        {loading ? (
          <p>Loading variants...</p>
        ) : variants.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            <p>No variants found. Create your first variant to get started.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Stock</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Quick Stock Update</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => {
                const isOutOfStock = variant.stockQuantity <= 0;
                return (
                  <tr
                    key={variant.id}
                    style={{
                      borderBottom: '1px solid #eee',
                      backgroundColor: isOutOfStock ? '#fff5f5' : 'white',
                    }}
                  >
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{variant.name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        fontWeight: 'bold',
                        color: isOutOfStock ? '#c33' : variant.stockQuantity < 10 ? '#f59e0b' : '#059669'
                      }}>
                        {variant.stockQuantity}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {!variant.isActive ? (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#fee',
                          color: '#c33',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}>
                          Inactive
                        </span>
                      ) : isOutOfStock ? (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#fee',
                          color: '#c33',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          Out of Stock
                        </span>
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#d1fae5',
                          color: '#059669',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}>
                          Available
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <button
                          onClick={() => quickUpdateStock(variant.id, variant.stockQuantity - 1)}
                          disabled={variant.stockQuantity <= 0}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: variant.stockQuantity <= 0 ? '#ccc' : '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: variant.stockQuantity <= 0 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          -1
                        </button>
                        <button
                          onClick={() => quickUpdateStock(variant.id, variant.stockQuantity + 1)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          +1
                        </button>
                        <button
                          onClick={() => quickUpdateStock(variant.id, variant.stockQuantity + 10)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          +10
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => startEdit(variant)}
                        style={{
                          padding: '0.25rem 0.5rem',
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </ProtectedRoute>
  );
}
