'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../../../components/protected-route';
import { useAuth } from '../../../../contexts/auth-context';
import { apiClient } from '../../../../lib/api-client';
import {
  PackWithComponentsDto,
  PackComponentDto,
  CreatePackComponentDto,
  ComponentDto,
  UserRole,
} from '@contracts/core';
import Link from 'next/link';

export default function PackComponentsPage() {
  const { logout } = useAuth();
  const params = useParams();
  const router = useRouter();
  const packId = params.id as string;

  const [pack, setPack] = useState<PackWithComponentsDto | null>(null);
  const [components, setComponents] = useState<ComponentDto[]>([]);
  const [packComponents, setPackComponents] = useState<PackComponentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreatePackComponentDto>({
    componentId: '',
    required: true,
    orderIndex: 0,
  });

  useEffect(() => {
    if (packId) {
      loadData();
    }
  }, [packId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [packData, allComponents, packComponentsData] = await Promise.all([
        apiClient.getPackById(packId),
        apiClient.getComponents(),
        apiClient.getPackComponents(packId),
      ]);
      setPack(packData);
      setComponents(allComponents);
      setPackComponents(packComponentsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await apiClient.addPackComponent(packId, formData);
      setShowAddForm(false);
      setFormData({ componentId: '', required: true, orderIndex: 0 });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add component');
    }
  };

  const availableComponents = components.filter(
    (c) => !packComponents.some((pc) => pc.componentId === c.id)
  );

  const sortedPackComponents = [...packComponents].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link href="/packs" style={{ marginRight: '1rem', textDecoration: 'none' }}>← Packs</Link>
            <h1 style={{ display: 'inline', marginLeft: '1rem' }}>
              {pack ? `Components: ${pack.name}` : 'Pack Components'}
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

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {showAddForm && availableComponents.length > 0 && (
              <form onSubmit={handleAdd} style={{
                padding: '1.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '2rem',
                backgroundColor: 'white'
              }}>
                <h2>Add Component to Pack</h2>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Component *</label>
                  <select
                    value={formData.componentId}
                    onChange={(e) => setFormData({ ...formData, componentId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Select a component</option>
                    {availableComponents.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Order Index *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                    required
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <small style={{ color: '#666' }}>Lower numbers appear first</small>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.required}
                      onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    />
                    Required
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
                    Add Component
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
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
                </div>
              </form>
            )}

            {!showAddForm && availableComponents.length > 0 && (
              <button
                onClick={() => setShowAddForm(true)}
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
                + Add Component
              </button>
            )}

            {availableComponents.length === 0 && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fff3cd',
                color: '#856404',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                All available components have been added to this pack. Create new components first.
              </div>
            )}

            {sortedPackComponents.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                <p>No components assigned to this pack yet.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Order</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Component</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Required</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPackComponents.map((pc) => (
                    <tr key={pc.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{pc.orderIndex}</td>
                      <td style={{ padding: '0.75rem' }}>{pc.componentName}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {pc.required ? (
                          <span style={{ color: '#c33', fontWeight: 'bold' }}>Yes</span>
                        ) : (
                          <span style={{ color: '#666' }}>No</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <Link
                          href={`/components/${pc.componentId}/variants`}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#0070f3',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            marginRight: '0.5rem'
                          }}
                        >
                          Manage Variants
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
